package vn.railway89.catalog;

import jakarta.persistence.*;

@Entity
@Table(name = "product_offering_detail",
       uniqueConstraints = @UniqueConstraint(columnNames = {"product_offering_id", "product_detail_id"}))
public class ProductOfferingDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_offering_id", nullable = false)
    private ProductOffering offering;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_detail_id", nullable = false)
    private ProductDetail detail;

    protected ProductOfferingDetail() {
    }

    ProductOfferingDetail(ProductOffering offering, ProductDetail detail) {
        this.offering = offering;
        this.detail = detail;
    }

    Long detailId() {
        return detail.getId();
    }
}
