package vn.railway89.catalog;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
public class CatalogController {
    private final CatalogService service;

    public CatalogController(CatalogService service) {
        this.service = service;
    }

    @PostMapping("/buoi-03/products")
    @ResponseStatus(HttpStatus.CREATED)
    public OfferingResponse create(@Valid @RequestBody ProductRequest request) {
        return service.create(request.name(), request.price(), request.color(), request.status());
    }

    @GetMapping("/buoi-03/products/{id}")
    public OfferingResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PutMapping("/buoi-03/products/{id}")
    public OfferingResponse update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return service.update(id, request);
    }

    @GetMapping("/buoi-05/offerings")
    public List<OfferingResponse> byDetail(@RequestParam Long detailId) {
        return service.findByDetail(detailId);
    }

    @PostMapping("/buoi-06/offerings")
    @ResponseStatus(HttpStatus.CREATED)
    public OfferingResponse createOffering(@Valid @RequestBody CreateOfferingRequest request) {
        return service.create(request.name(), request.price(), request.color(), ProductOffering.Status.ACTIVE);
    }

    @PostMapping("/buoi-06/details")
    @ResponseStatus(HttpStatus.CREATED)
    public DetailResponse createDetail(@Valid @RequestBody DetailRequest request) {
        return service.createDetail(request);
    }

    @GetMapping("/buoi-06/offerings/{id}/details")
    public AssignmentResponse getDetails(@PathVariable Long id) {
        return service.getDetails(id);
    }

    @PutMapping("/buoi-06/offerings/{id}/details")
    public AssignmentResponse replaceDetails(@PathVariable Long id, @Valid @RequestBody AssignmentRequest request) {
        return service.replaceDetails(id, request.detailIds());
    }

    public record ProductRequest(@NotBlank @Size(max = 100) String name,
                                 @NotNull @Positive Long price,
                                 @NotBlank @Size(max = 30) String color,
                                 @NotNull ProductOffering.Status status) {}

    public record CreateOfferingRequest(@NotBlank @Size(max = 100) String name,
                                        @NotNull @Positive Long price,
                                        @NotBlank @Size(max = 30) String color) {}

    public record DetailRequest(@NotBlank @Size(max = 100) String brand,
                                @NotBlank @Size(max = 30) String power) {}

    public record AssignmentRequest(@NotNull List<@NotNull @Positive Long> detailIds) {}

    public record OfferingResponse(Long id, String name, Long price, String color, ProductOffering.Status status) {
        static OfferingResponse from(ProductOffering entity) {
            return new OfferingResponse(entity.id, entity.name, entity.price, entity.color, entity.status);
        }
    }

    public record DetailResponse(Long id, String brand, String power) {}

    public record AssignmentResponse(Long offeringId, List<Long> detailIds) {}
}
