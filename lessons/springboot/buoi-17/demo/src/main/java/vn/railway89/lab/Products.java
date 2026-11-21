package vn.railway89.lab;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.List;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.web.bind.annotation.*;

enum Color { BLACK, WHITE }
enum ProductStatus { ACTIVE, INACTIVE }

@Entity
@Table(name = "products")
class Product {
    @Id Long id;
    String name;
    long price;
    @Enumerated(EnumType.STRING) Color color;
    @Enumerated(EnumType.STRING) ProductStatus status;

    public Long getId() { return id; }
    public String getName() { return name; }
}

record Summary(Long id, String name) {}
record ProductView(Long id, String name, long price, Color color, ProductStatus status) {
    static ProductView of(Product p) {
        return new ProductView(p.id, p.name, p.price, p.color, p.status);
    }
}

interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    @Query(value = "select * from products order by id limit :limit offset :skip", nativeQuery = true)
    List<Product> pageSql(@Param("limit") int limit, @Param("skip") long skip);

    @Query("select new vn.railway89.lab.Summary(p.id, p.name) from Product p order by p.id")
    List<Summary> summaries();
}

record ProductFilter(String name, Long minPrice, Long maxPrice, Color color, ProductStatus status) {}

final class ProductSpecifications {
    private ProductSpecifications() {}

    static Specification<Product> nameContains(String name) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("name")), "%" + Like.literal(name) + "%", '!');
    }

    static Specification<Product> from(ProductFilter f) {
        Specification<Product> spec = (root, query, cb) -> cb.conjunction();
        if (f.name() != null && !f.name().isBlank()) spec = spec.and(nameContains(f.name().trim()));
        if (f.minPrice() != null) spec = spec.and((r,q,b) -> b.ge(r.get("price"), f.minPrice()));
        if (f.maxPrice() != null) spec = spec.and((r,q,b) -> b.le(r.get("price"), f.maxPrice()));
        if (f.color() != null) spec = spec.and((r,q,b) -> b.equal(r.get("color"), f.color()));
        if (f.status() != null) spec = spec.and((r,q,b) -> b.equal(r.get("status"), f.status()));
        return spec;
    }
}

@RestController
@RequestMapping("/api/products")
class Products {
    private final ProductRepository repo;
    private final ModelMapper mapper;
    Products(ProductRepository repo, ModelMapper mapper) { this.repo = repo; this.mapper = mapper; }

    public static class MappedSummary {
        private Long id;
        private String name;
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    record PageView<T>(List<T> items, int page, int size, long totalElements, long totalPages) {
        static <T> PageView<T> of(Page<T> result) {
            return new PageView<>(result.getContent(), result.getNumber() + 1, result.getSize(),
                result.getTotalElements(), result.getTotalPages());
        }
    }

    @GetMapping("/page")
    PageView<ProductView> page(@RequestParam(defaultValue = "1") int page,
                               @RequestParam(defaultValue = "2") int size,
                               @RequestParam(defaultValue = "id") String order,
                               @RequestParam(defaultValue = "jpa") String mode) {
        var request = pageable(page, size, order);
        if ("jpa".equals(mode)) return PageView.of(repo.findAll(request).map(ProductView::of));
        if (!"sql".equals(mode) || !"id".equals(order))
            throw LabError.badInput("mode must be jpa or sql; sql supports only id order.");
        List<ProductView> items = repo.pageSql(size, request.getOffset()).stream().map(ProductView::of).toList();
        long total = repo.count();
        return new PageView<>(items, page, size, total, total / size + (total % size == 0 ? 0 : 1));
    }

    @GetMapping
    PageView<ProductView> filter(@ModelAttribute ProductFilter filter,
                                @RequestParam(defaultValue = "1") int page,
                                @RequestParam(defaultValue = "10") int size,
                                @RequestParam(defaultValue = "id") String order) {
        if ((filter.minPrice() != null && filter.minPrice() < 0)
            || (filter.maxPrice() != null && filter.maxPrice() < 0)
            || (filter.minPrice() != null && filter.maxPrice() != null && filter.minPrice() > filter.maxPrice()))
            throw LabError.badInput("Prices must be nonnegative and minPrice <= maxPrice.");
        return PageView.of(repo.findAll(ProductSpecifications.from(filter), pageable(page, size, order)).map(ProductView::of));
    }

    @GetMapping("/summary")
    List<Summary> summary() { return repo.summaries(); }

    @GetMapping("/mapped")
    List<MappedSummary> mapped() {
        return repo.findAll(Sort.by("id")).stream().map(p -> mapper.map(p, MappedSummary.class)).toList();
    }

    private static Pageable pageable(int page, int size, String order) {
        if (page < 1 || size < 1 || size > 100) throw LabError.badInput("page >= 1; size in [1, 100].");
        Sort sort = switch (order) {
            case "id" -> Sort.by("id");
            case "price" -> Sort.by("price", "id");
            default -> throw LabError.badInput("order must be id or price.");
        };
        if ((long)(page - 1) * size > Integer.MAX_VALUE) throw LabError.badInput("Offset is too large.");
        return PageRequest.of(page - 1, size, sort);
    }
}
