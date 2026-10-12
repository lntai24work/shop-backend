package com.tai.shop.catalog.product.image;

import com.tai.shop.catalog.product.Product;
import com.tai.shop.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "product_images")
@Getter
@Setter
@NoArgsConstructor
public class ProductImage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "public_id", nullable = false, length = 255)
    private String publicId;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "is_thumbnail", nullable = false)
    private boolean isThumbnail = false;

    public ProductImage(Product product, String imageUrl, String publicId, Integer displayOrder, boolean isThumbnail) {
        this.product = product;
        this.imageUrl = imageUrl;
        this.publicId = publicId;
        this.displayOrder = displayOrder != null ? displayOrder : 0;
        this.isThumbnail = isThumbnail;
    }
}
