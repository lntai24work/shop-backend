package com.tai.shop.user;

import com.tai.shop.user.dto.UserFilterRequest;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class UserSpecification {

    private UserSpecification() {
        // Utility class
    }

    public static Specification<User> filter(UserFilterRequest request) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Chỉ lấy user chưa bị xóa mềm
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (request != null) {
                // 2. Keyword: email, fullName, hoặc phone
                if (StringUtils.hasText(request.keyword())) {
                    String pattern = "%" + request.keyword().toLowerCase().trim() + "%";
                    Predicate nameLike = cb.like(cb.lower(root.get("fullName")), pattern);
                    Predicate emailLike = cb.like(cb.lower(root.get("email")), pattern);
                    Predicate phoneLike = cb.like(cb.lower(root.get("phone")), pattern);
                    predicates.add(cb.or(nameLike, emailLike, phoneLike));
                }

                // 3. Status
                if (request.status() != null) {
                    predicates.add(cb.equal(root.get("status"), request.status()));
                }

                // 4. Role
                if (StringUtils.hasText(request.role()) && !"ALL".equalsIgnoreCase(request.role())) {
                    try {
                        RoleType roleType = RoleType.valueOf(request.role().trim().toUpperCase());
                        Join<User, Role> roleJoin = root.join("roles");
                        predicates.add(cb.equal(roleJoin.get("name"), roleType));
                    } catch (IllegalArgumentException ignored) {
                    }
                }
            }

            if (query != null) {
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
