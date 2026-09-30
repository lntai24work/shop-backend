package com.tai.shop.catalog.category;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    @Query("SELECT DISTINCT c FROM Category c LEFT JOIN FETCH c.children child WHERE c.parent IS NULL AND c.status = 'ACTIVE' ORDER BY c.displayOrder ASC")
    List<Category> findActiveRootCategoriesWithChildren();

    List<Category> findAllByOrderByDisplayOrderAsc();
}
