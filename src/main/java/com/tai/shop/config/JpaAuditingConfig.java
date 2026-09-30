package com.tai.shop.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Bật JPA Auditing để @CreatedDate / @LastModifiedDate tự điền giá trị.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
