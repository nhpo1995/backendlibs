package vn.railway89.catalog;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OfferingRepository extends JpaRepository<ProductOffering, Long> {
    @Query("""
            select distinct o from ProductOffering o
            join o.links link
            where link.detail.id = :detailId
            order by o.id
            """)
    List<ProductOffering> findByLinkedDetail(@Param("detailId") Long detailId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from ProductOffering o where o.id = :id")
    Optional<ProductOffering> findForUpdate(@Param("id") Long id);
}
