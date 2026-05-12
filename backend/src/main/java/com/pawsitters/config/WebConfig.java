package com.pawsitters.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String uploadLocation;

    public WebConfig(@Value("${app.upload.dir:uploads}") String uploadDir) {
        String resolvedUploadDir = uploadDir == null || uploadDir.isBlank() ? "uploads" : uploadDir;
        String location = Paths.get(resolvedUploadDir)
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();
        this.uploadLocation = location.endsWith("/") ? location : location + "/";
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadLocation);
    }
}
