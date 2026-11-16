package vn.railway89.catalog;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class CatalogSearch {
    private final EntityManager em;

    CatalogSearch(EntityManager em) {
        this.em = em;
    }

    @Transactional(readOnly = true)
    public List<Result> search(String name, String color, ProductOffering.Status status,
                               Long minPrice, Long maxPrice) {
        var cb = em.getCriteriaBuilder();
        var query = cb.createQuery(ProductOffering.class);
        var offering = query.from(ProductOffering.class);
        List<Predicate> filters = new ArrayList<>();

        if (name != null && !name.isBlank()) {
            String literal = name.strip().toLowerCase(Locale.ROOT)
                    .replace("!", "!!").replace("%", "!%").replace("_", "!_");
            filters.add(cb.like(cb.lower(offering.get("name")), "%" + literal + "%", '!'));
        }
        if (color != null && !color.isBlank()) {
            filters.add(cb.equal(offering.get("color"), color.strip()));
        }
        if (status != null) filters.add(cb.equal(offering.get("status"), status));
        if (minPrice != null) filters.add(cb.ge(offering.get("price"), minPrice));
        if (maxPrice != null) filters.add(cb.le(offering.get("price"), maxPrice));

        query.select(offering).where(filters.toArray(Predicate[]::new))
                .orderBy(cb.asc(offering.get("id")));
        return em.createQuery(query).getResultList().stream()
                .map(o -> new Result(o.id, o.name, o.price, o.color, o.status))
                .toList();
    }

    record Result(Long id, String name, Long price, String color, ProductOffering.Status status) {}
}
