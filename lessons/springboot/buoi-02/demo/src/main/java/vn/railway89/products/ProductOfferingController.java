package vn.railway89.products;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/products")
public class ProductOfferingController {
    private final ProductOfferingService service;

    public ProductOfferingController(ProductOfferingService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProductOffering> list() {
        return service.list();
    }

    @GetMapping("/by-name")
    public List<ProductOffering> searchByName(@RequestParam("name") String name) {
        return service.searchByName(name);
    }

    @GetMapping("/by-name-and-price")
    public List<ProductOffering> searchByNameAndPrice(
            @RequestParam("name") String name, @RequestParam("price") Long price) {
        return service.searchByNameAndPrice(name, price);
    }
}
