package vn.railway89.catalog;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import vn.railway89.catalog.CatalogController.AssignmentResponse;
import vn.railway89.catalog.CatalogController.DetailRequest;
import vn.railway89.catalog.CatalogController.DetailResponse;
import vn.railway89.catalog.CatalogController.OfferingResponse;
import vn.railway89.catalog.CatalogController.ProductRequest;

@Service
public class CatalogService {
    private final OfferingRepository offerings;
    private final DetailRepository details;
    private final LinkRepository links;

    public CatalogService(OfferingRepository offerings, DetailRepository details, LinkRepository links) {
        this.offerings = offerings;
        this.details = details;
        this.links = links;
    }

    public OfferingResponse create(String name, Long price, String color, ProductOffering.Status status) {
        ProductOffering saved = offerings.save(new ProductOffering(name, price, color, status));
        return OfferingResponse.from(saved);
    }

    public OfferingResponse get(Long id) {
        return OfferingResponse.from(offerings.findById(id).orElseThrow(CatalogService::missingOffering));
    }

    @Transactional
    public OfferingResponse update(Long id, ProductRequest request) {
        ProductOffering offering = offerings.findForUpdate(id).orElseThrow(CatalogService::missingOffering);
        offering.update(request.name(), request.price(), request.color(), request.status());
        return OfferingResponse.from(offering);
    }

    public List<OfferingResponse> findByDetail(Long detailId) {
        return offerings.findByLinkedDetail(detailId).stream().map(OfferingResponse::from).toList();
    }

    public DetailResponse createDetail(DetailRequest request) {
        ProductDetail saved = details.save(new ProductDetail(request.brand(), request.power()));
        return new DetailResponse(saved.getId(), saved.brand, saved.power);
    }

    @Transactional(readOnly = true)
    public AssignmentResponse getDetails(Long offeringId) {
        if (!offerings.existsById(offeringId)) {
            throw missingOffering();
        }
        List<Long> detailIds = links.findByOffering_Id(offeringId).stream()
                .map(ProductOfferingDetail::detailId).sorted().toList();
        return new AssignmentResponse(offeringId, detailIds);
    }

    @Transactional
    public AssignmentResponse replaceDetails(Long offeringId, List<Long> requestedIds) {
        Set<Long> desired = new HashSet<>(requestedIds);
        if (desired.size() != requestedIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate detail IDs");
        }

        ProductOffering offering = offerings.findForUpdate(offeringId).orElseThrow(CatalogService::missingOffering);
        List<ProductDetail> targets = details.findAllById(desired);
        if (targets.size() != desired.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "One or more details were not found");
        }

        List<ProductOfferingDetail> current = links.findByOffering_Id(offeringId);
        Set<Long> existingIds = new HashSet<>();
        for (ProductOfferingDetail link : current) {
            existingIds.add(link.detailId());
            if (!desired.contains(link.detailId())) {
                links.delete(link);
            }
        }
        for (ProductDetail detail : targets) {
            if (!existingIds.contains(detail.getId())) {
                links.save(new ProductOfferingDetail(offering, detail));
            }
        }
        return new AssignmentResponse(offeringId, desired.stream().sorted().toList());
    }

    private static ResponseStatusException missingOffering() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Offering was not found");
    }
}
