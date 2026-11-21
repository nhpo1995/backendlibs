package vn.railway89.products.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.railway89.products.entity.ProductOffering;

public interface ProductOfferingRepository extends JpaRepository<ProductOffering, Long> {
}
