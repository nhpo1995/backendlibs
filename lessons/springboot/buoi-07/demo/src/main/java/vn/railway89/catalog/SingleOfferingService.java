package vn.railway89.catalog;

import org.hibernate.Hibernate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SingleOfferingService {
    private final SingleOfferingRepository repository;

    public SingleOfferingService(SingleOfferingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public FetchResponse inspect(Long id, boolean includeDetail, boolean fetchJoin) {
        var result = fetchJoin ? repository.findWithDetail(id) : repository.findById(id);
        SingleOffering offering = result.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        SingleDetail detail = offering.detail;
        boolean initializedBefore = detail != null && Hibernate.isInitialized(detail);
        String specification = includeDetail && detail != null ? detail.getSpecification() : null;
        boolean initializedAfter = detail != null && Hibernate.isInitialized(detail);
        return new FetchResponse(offering.id, offering.name, detail != null, specification,
                                 initializedBefore, initializedAfter);
    }

    public record FetchResponse(Long id, String name, boolean hasDetail, String specification,
                                boolean initializedBefore, boolean initializedAfter) {}
}
