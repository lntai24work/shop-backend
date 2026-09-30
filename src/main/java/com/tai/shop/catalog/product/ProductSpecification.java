package com.tai.shop.catalog.product;

import com.tai.shop.catalog.product.dto.ProductFilterRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {

    private ProductSpecification() {
        // Private constructor for utility class
    }

    public static Specification<Product> filter(ProductFilterRequest request, List<Long> categoryIds) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Chỉ lấy sản phẩm chưa bị xóa mềm
            predicates.add(cb.isNull(root.get("deletedAt")));

            // 2. Lọc theo từ khóa (name hoặc shortDescription)
            if (request != null && StringUtils.hasText(request.keyword())) {
                String pattern = "%" + request.keyword().toLowerCase().trim() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), pattern);
                Predicate descLike = cb.like(cb.lower(root.get("shortDescription")), pattern);
                predicates.add(cb.or(nameLike, descLike));
            }

            // 3. Lọc theo danh mục (hỗ trợ category và danh mục con của nó)
            if (!CollectionUtils.isEmpty(categoryIds)) {
                predicates.add(root.get("category").get("id").in(categoryIds));
            } else if (request != null && request.categoryId() != null) {
                predicates.add(cb.equal(root.get("category").get("id"), request.categoryId()));
            }

            // 4. Lọc theo khoảng giá
            if (request != null && request.minPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), request.minPrice()));
            }
            if (request != null && request.maxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), request.maxPrice()));
            }

            // 5. Lọc theo trạng thái
            if (request != null && request.status() != null) {
                predicates.add(cb.equal(root.get("status"), request.status()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
