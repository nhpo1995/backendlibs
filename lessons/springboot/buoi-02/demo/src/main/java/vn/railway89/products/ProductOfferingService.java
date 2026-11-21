package vn.railway89.products;

import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class ProductOfferingService {
    private final ProductOfferingRepository repository;

    public ProductOfferingService(ProductOfferingRepository repository) {
        this.repository = repository;
    }

    public List<ProductOffering> list() {
        return repository.findAll(Sort.by("id"));
    }

    public List<ProductOffering> searchByName(String name) {
        return repository.findByNameOrderByIdAsc(name);
    }

    public List<ProductOffering> searchByNameAndPrice(String name, Long price) {
        return repository.findByNameAndPriceOrderByIdAsc(name, price);
    }
}
