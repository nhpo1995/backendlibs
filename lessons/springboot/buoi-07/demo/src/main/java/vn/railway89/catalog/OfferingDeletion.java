package vn.railway89.catalog;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

interface OfferingLinkDeletion extends Repository<ProductOfferingDetail, Long> {
    @Modifying(flushAutomatically = true)
    @Query("delete from ProductOfferingDetail link where link.offering.id = :id")
    int deleteLinks(@Param("id") long id);
}

@Service
class OfferingDeletion {
    private final OfferingRepository offerings;
    private final OfferingLinkDeletion links;

    OfferingDeletion(OfferingRepository offerings, OfferingLinkDeletion links) {
        this.offerings = offerings;
        this.links = links;
    }

    @Transactional
    public void delete(long id) {
        var offering = offerings.findForUpdate(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));
        links.deleteLinks(id);
        offerings.delete(offering);
    }
}
