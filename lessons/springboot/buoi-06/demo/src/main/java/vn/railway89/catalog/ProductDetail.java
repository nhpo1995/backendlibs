package vn.railway89.catalog;

import jakarta.persistence.*;

@Entity
@Table(name = "product_details")
public class ProductDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    String brand;

    @Column(nullable = false, length = 30)
    String power;

    protected ProductDetail() {
    }

    ProductDetail(String brand, String power) {
        this.brand = brand;
        this.power = power;
    }

    public Long getId() {
        return id;
    }
}
