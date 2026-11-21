package vn.railway89.products;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductOfferingRepository extends JpaRepository<ProductOffering, Long> {
    List<ProductOffering> findByNameOrderByIdAsc(String name);

    List<ProductOffering> findByNameAndPriceOrderByIdAsc(String name, Long price);
}
