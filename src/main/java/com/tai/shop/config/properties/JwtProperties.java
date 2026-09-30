package com.tai.shop.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    private String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private long accessTokenExpirationMs = 900000; // 15 phút
    private long refreshTokenExpirationMs = 604800000; // 7 ngày
}
