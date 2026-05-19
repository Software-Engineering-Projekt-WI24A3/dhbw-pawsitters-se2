package com.pawsitters.config;

import com.pawsitters.security.JwtService;
import com.pawsitters.security.JwtTokenResolver;
import com.pawsitters.security.RevokedTokenService;
import com.pawsitters.service.ChatAuthorizationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final String AUTH_TOKEN_SESSION_ATTRIBUTE = "pawsittersAuthToken";
    private static final Pattern CHAT_TOPIC_PATTERN = Pattern.compile("^/topic/chats/(\\d+)/messages$");

    private final JwtService jwtService;
    private final JwtTokenResolver jwtTokenResolver;
    private final RevokedTokenService revokedTokenService;
    private final ChatAuthorizationService chatAuthorizationService;
    private final String allowedOriginPatterns;

    public WebSocketConfig(JwtService jwtService,
                           JwtTokenResolver jwtTokenResolver,
                           RevokedTokenService revokedTokenService,
                           ChatAuthorizationService chatAuthorizationService,
                           @Value("${app.cors.allowed-origin-patterns:http://localhost:*,http://127.0.0.1:*,https://localhost:*,https://127.0.0.1:*,https://*.justus.software,https://justus.software,http://*.justus.software,http://justus.software}") String allowedOriginPatterns) {
        this.jwtService = jwtService;
        this.jwtTokenResolver = jwtTokenResolver;
        this.revokedTokenService = revokedTokenService;
        this.chatAuthorizationService = chatAuthorizationService;
        this.allowedOriginPatterns = allowedOriginPatterns;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .addInterceptors(new JwtCookieHandshakeInterceptor())
                .setAllowedOriginPatterns(splitCsv(allowedOriginPatterns));
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) {
                    return message;
                }

                StompCommand command = accessor.getCommand();
                if (StompCommand.CONNECT.equals(command)) {
                    authenticateConnect(accessor);
                } else if (StompCommand.SUBSCRIBE.equals(command) || StompCommand.SEND.equals(command)) {
                    requireAuthenticatedUser(accessor);
                    authorizeChatDestination(accessor);
                }
                return message;
            }
        });
    }

    private void authenticateConnect(StompHeaderAccessor accessor) {
        if (accessor.getUser() != null) {
            return;
        }

        String authorizationHeader = accessor.getFirstNativeHeader("Authorization");
        String token = jwtTokenResolver.resolveFromAuthorizationHeader(authorizationHeader)
                .or(() -> resolveHandshakeToken(accessor))
                .orElseThrow(() -> new AccessDeniedException("Authentication required."));

        if (revokedTokenService.isRevoked(token) || !jwtService.isTokenValid(token)) {
            throw new AccessDeniedException("Authentication required.");
        }

        String email = jwtService.extractEmail(token);
        String role = jwtService.extractRole(token);
        var authentication = new UsernamePasswordAuthenticationToken(
                email,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
        accessor.setUser(authentication);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private void requireAuthenticatedUser(StompHeaderAccessor accessor) {
        if (accessor.getUser() == null) {
            throw new AccessDeniedException("Authentication required.");
        }
    }

    private Optional<String> resolveHandshakeToken(StompHeaderAccessor accessor) {
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes == null) {
            return Optional.empty();
        }

        Object token = sessionAttributes.get(AUTH_TOKEN_SESSION_ATTRIBUTE);
        if (token instanceof String tokenValue && !tokenValue.isBlank()) {
            return Optional.of(tokenValue);
        }
        return Optional.empty();
    }

    private void authorizeChatDestination(StompHeaderAccessor accessor) {
        Long chatId = resolveChatTopicId(accessor.getDestination());
        if (chatId == null) {
            return;
        }

        chatAuthorizationService.assertParticipant(chatId, accessor.getUser().getName());
    }

    private Long resolveChatTopicId(String destination) {
        if (destination == null || destination.isBlank()) {
            return null;
        }

        Matcher matcher = CHAT_TOPIC_PATTERN.matcher(destination.trim());
        if (!matcher.matches()) {
            return null;
        }

        try {
            return Long.valueOf(matcher.group(1));
        } catch (NumberFormatException e) {
            throw new AccessDeniedException("Invalid chat destination.");
        }
    }

    private String[] splitCsv(String raw) {
        if (raw == null || raw.isBlank()) {
            return new String[0];
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toArray(String[]::new);
    }

    private class JwtCookieHandshakeInterceptor implements HandshakeInterceptor {
        @Override
        public boolean beforeHandshake(ServerHttpRequest request,
                                       ServerHttpResponse response,
                                       WebSocketHandler wsHandler,
                                       Map<String, Object> attributes) {
            if (request instanceof ServletServerHttpRequest servletRequest) {
                HttpServletRequest httpRequest = servletRequest.getServletRequest();
                jwtTokenResolver.resolve(httpRequest)
                        .ifPresent(token -> attributes.put(AUTH_TOKEN_SESSION_ATTRIBUTE, token));
            }
            return true;
        }

        @Override
        public void afterHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Exception exception) {
            // No cleanup needed.
        }
    }
}
