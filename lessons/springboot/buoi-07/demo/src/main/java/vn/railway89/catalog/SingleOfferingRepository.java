package vn.railway89.catalog;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SingleOfferingRepository extends JpaRepository<SingleOffering, Long> {
    @Query("select o from SingleOffering o left join fetch o.detail where o.id = :id")
    Optional<SingleOffering> findWithDetail(@Param("id") Long id);
}
