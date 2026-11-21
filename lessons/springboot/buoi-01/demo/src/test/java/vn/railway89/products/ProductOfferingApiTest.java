package vn.railway89.products;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:railway89;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.sql.init.mode=always"
})
@AutoConfigureMockMvc
class ProductOfferingApiTest {
    @Autowired
    private MockMvc http;

    @Test
    void returnsProductDetailsAsJson() throws Exception {
        http.perform(get("/products/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("Product A"))
            .andExpect(jsonPath("$.price").value(100000))
            .andExpect(jsonPath("$.color").value("red"));
    }

    @Test
    void returnsNotFoundWhenIdDoesNotExist() throws Exception {
        http.perform(get("/products/999"))
            .andExpect(status().isNotFound());
    }

    @Test
    void returnsBadRequestWhenPathIdIsNotANumber() throws Exception {
        http.perform(get("/products/abc"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @Sql(statements = "INSERT INTO product_offerings (id, name, price, color) VALUES (7, 'Nullable product', NULL, NULL)")
    void preservesNullPriceAndColor() throws Exception {
        http.perform(get("/products/7"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.price").hasJsonPath())
            .andExpect(jsonPath("$.price").isEmpty())
            .andExpect(jsonPath("$.color").hasJsonPath())
            .andExpect(jsonPath("$.color").isEmpty());
    }
}
