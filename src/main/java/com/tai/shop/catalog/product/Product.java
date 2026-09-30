package com.tai.shop.catalog.product;

import com.tai.shop.catalog.category.Category;
import com.tai.shop.common.base.SoftDeletableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
public class Product extends SoftDeletableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "slug", nullable = false, unique = true, length = 280)
    private String slug;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(name = "description", columnDefinition = "LONGTEXT")
    private String description;

    @Column(name = "price", nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "original_price", precision = 15, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "stock", nullable = false)
    private Integer stock = 0;

    @Column(name = "sold_count", nullable = false)
    private Integer soldCount = 0;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ProductStatus status = ProductStatus.ACTIVE;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    public Product(Category category, String name, String slug, String shortDescription,
                   String description, BigDecimal price, BigDecimal originalPrice,
                   Integer stock, String thumbnailUrl, ProductStatus status) {
        this.category = category;
        this.name = name;
        this.slug = slug;
        this.shortDescription = shortDescription;
        this.description = description;
        this.price = price;
        this.originalPrice = originalPrice;
        this.stock = stock != null ? stock : 0;
        this.soldCount = 0;
        this.thumbnailUrl = thumbnailUrl;
        this.status = status != null ? status : ProductStatus.ACTIVE;
        this.version = 0L;
    }
}
