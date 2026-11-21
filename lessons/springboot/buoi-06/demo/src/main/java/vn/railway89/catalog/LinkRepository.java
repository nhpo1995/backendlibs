package vn.railway89.catalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LinkRepository extends JpaRepository<ProductOfferingDetail, Long> {
    List<ProductOfferingDetail> findByOffering_Id(Long offeringId);
}
