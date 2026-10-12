package com.tai.shop.common.base;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

/**
 * Entity hỗ trợ xóa mềm (soft delete).
 * Thêm @SQLRestriction để Hibernate tự động lọc bản ghi chưa bị xóa trong mọi query.
 */
@Getter
@Setter
@MappedSuperclass
@SQLRestriction("deleted_at IS NULL")
public abstract class SoftDeletableEntity extends BaseEntity {

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public void softDelete() {
        this.deletedAt = Instant.now();
    }
}
