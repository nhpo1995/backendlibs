package vn.railway89.catalog;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_offerings")
public class ProductOffering {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, length = 100)
    String name;

    @Column(nullable = false)
    Long price;

    @Column(nullable = false, length = 30)
    String color;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    Status status;

    @OneToMany(mappedBy = "offering")
    List<ProductOfferingDetail> links = new ArrayList<>();

    protected ProductOffering() {
    }

    ProductOffering(String name, Long price, String color, Status status) {
        update(name, price, color, status);
    }

    void update(String name, Long price, String color, Status status) {
        this.name = name;
        this.price = price;
        this.color = color;
        this.status = status;
    }

    public enum Status { ACTIVE, INACTIVE }
}
