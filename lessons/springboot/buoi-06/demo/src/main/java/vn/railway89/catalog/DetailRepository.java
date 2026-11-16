package vn.railway89.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DetailRepository extends JpaRepository<ProductDetail, Long> {
}
