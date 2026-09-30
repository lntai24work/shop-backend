package com.tai.shop.catalog.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    @EntityGraph(attributePaths = {"category"})
    Optional<Product> findWithCategoryBySlugAndDeletedAtIsNull(String slug);

    @EntityGraph(attributePaths = {"category"})
    Optional<Product> findWithCategoryByIdAndDeletedAtIsNull(Long id);

    Optional<Product> findByIdAndDeletedAtIsNull(Long id);

    Optional<Product> findBySlugAndDeletedAtIsNull(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    @Override
    @EntityGraph(attributePaths = {"category"})
    Page<Product> findAll(Specification<Product> spec, Pageable pageable);
}
