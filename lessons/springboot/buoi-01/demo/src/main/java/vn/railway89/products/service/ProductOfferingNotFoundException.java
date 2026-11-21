package vn.railway89.products.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ProductOfferingNotFoundException extends RuntimeException {
    public ProductOfferingNotFoundException(Long id) {
        super("Product offering " + id + " was not found");
    }
}
