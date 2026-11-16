package vn.railway89.products.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.railway89.products.entity.ProductOffering;
import vn.railway89.products.service.ProductOfferingService;

@RestController
@RequestMapping("/products")
public class ProductOfferingController {
    private final ProductOfferingService service;

    public ProductOfferingController(ProductOfferingService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductOffering> getById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(service.getById(id));
    }
}
