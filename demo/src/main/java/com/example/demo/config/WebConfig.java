package com.example.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${qr.directory:src/main/resources/static/qr}")
    private String qrDirectory;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Servir archivos QR desde la carpeta configurada
        registry
                .addResourceHandler("/qr/**")
                .addResourceLocations("file:" + qrDirectory + "/", "classpath:/static/qr/");

        // Servir otros recursos estáticos
        registry
                .addResourceHandler("/**")
                .addResourceLocations("classpath:/static/", "classpath:/public/");
    }
}