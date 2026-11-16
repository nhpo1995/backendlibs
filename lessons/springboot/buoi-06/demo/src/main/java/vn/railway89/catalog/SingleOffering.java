package vn.railway89.catalog;

import jakarta.persistence.*;

@Entity
@Table(name = "single_offering")
public class SingleOffering {
    @Id
    Long id;

    String name;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "detail_id", unique = true)
    SingleDetail detail;

    protected SingleOffering() {
    }
}
