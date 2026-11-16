package vn.railway89.products.service;

import org.springframework.stereotype.Service;
import vn.railway89.products.entity.ProductOffering;
import vn.railway89.products.repository.ProductOfferingRepository;

@Service
public class ProductOfferingServiceImpl implements ProductOfferingService {
    private final ProductOfferingRepository repository;

    public ProductOfferingServiceImpl(ProductOfferingRepository repository) {
        this.repository = repository;
    }

    @Override
    public ProductOffering getById(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ProductOfferingNotFoundException(id));
    }
}
