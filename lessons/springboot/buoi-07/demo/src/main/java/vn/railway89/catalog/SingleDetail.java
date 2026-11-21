package vn.railway89.catalog;

import jakarta.persistence.*;

@Entity
@Table(name = "single_detail")
public class SingleDetail {
    @Id
    private Long id;

    private String specification;

    protected SingleDetail() {
    }

    public String getSpecification() {
        return specification;
    }
}
