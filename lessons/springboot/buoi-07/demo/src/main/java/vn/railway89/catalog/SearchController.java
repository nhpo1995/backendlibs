package vn.railway89.catalog;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/buoi-07/offerings")
class SearchController {
    private final CatalogSearch search;
    private final OfferingDeletion deletion;

    SearchController(CatalogSearch search, OfferingDeletion deletion) {
        this.search = search;
        this.deletion = deletion;
    }

    @GetMapping
    List<CatalogSearch.Result> list(@RequestParam(required = false) String name,
                                   @RequestParam(required = false) String color,
                                   @RequestParam(required = false) ProductOffering.Status status,
                                   @RequestParam(required = false) Long minPrice,
                                   @RequestParam(required = false) Long maxPrice) {
        if ((minPrice != null && minPrice < 0) || (maxPrice != null && maxPrice < 0)
                || (minPrice != null && maxPrice != null && minPrice > maxPrice)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khoảng giá không hợp lệ");
        }
        return search.search(name, color, status, minPrice, maxPrice);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable long id) {
        deletion.delete(id);
    }
}
