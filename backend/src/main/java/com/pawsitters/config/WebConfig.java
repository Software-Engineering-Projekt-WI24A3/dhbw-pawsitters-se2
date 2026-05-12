package com.pawsitters.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;
import java.util.Arrays;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String uploadLocation;
    private final String corsAllowedOriginPatterns;
    private final String corsAllowedMethods;
    private final String corsAllowedHeaders;
    private final String corsExposedHeaders;
    private final boolean corsAllowCredentials;
    private final long corsMaxAgeSeconds;

    public WebConfig(@Value("${app.upload.dir:uploads}") String uploadDir,
                     @Value("${app.cors.allowed-origin-patterns:http://localhost:*,http://127.0.0.1:*,https://localhost:*,https://127.0.0.1:*}") String corsAllowedOriginPatterns,
                     @Value("${app.cors.allowed-methods:GET,POST,PUT,PATCH,DELETE,OPTIONS}") String corsAllowedMethods,
                     @Value("${app.cors.allowed-headers:*}") String corsAllowedHeaders,
                     @Value("${app.cors.exposed-headers:}") String corsExposedHeaders,
                     @Value("${app.cors.allow-credentials:true}") boolean corsAllowCredentials,
                     @Value("${app.cors.max-age-seconds:3600}") long corsMaxAgeSeconds) {
        String resolvedUploadDir = uploadDir == null || uploadDir.isBlank() ? "uploads" : uploadDir;
        String location = Paths.get(resolvedUploadDir)
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();
        this.uploadLocation = location.endsWith("/") ? location : location + "/";
        this.corsAllowedOriginPatterns = corsAllowedOriginPatterns;
        this.corsAllowedMethods = corsAllowedMethods;
        this.corsAllowedHeaders = corsAllowedHeaders;
        this.corsExposedHeaders = corsExposedHeaders;
        this.corsAllowCredentials = corsAllowCredentials;
        this.corsMaxAgeSeconds = Math.max(0, corsMaxAgeSeconds);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadLocation);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(splitCsv(corsAllowedOriginPatterns))
                .allowedMethods(splitCsv(corsAllowedMethods))
                .allowedHeaders(splitCsv(corsAllowedHeaders))
                .exposedHeaders(splitCsv(corsExposedHeaders))
                .allowCredentials(corsAllowCredentials)
                .maxAge(corsMaxAgeSeconds);

        registry.addMapping("/actuator/**")
                .allowedOriginPatterns(splitCsv(corsAllowedOriginPatterns))
                .allowedMethods("GET", "OPTIONS")
                .allowedHeaders(splitCsv(corsAllowedHeaders))
                .exposedHeaders(splitCsv(corsExposedHeaders))
                .allowCredentials(corsAllowCredentials)
                .maxAge(corsMaxAgeSeconds);
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
}
