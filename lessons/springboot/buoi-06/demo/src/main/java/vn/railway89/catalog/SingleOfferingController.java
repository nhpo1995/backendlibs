package vn.railway89.catalog;

import org.springframework.web.bind.annotation.*;
import vn.railway89.catalog.SingleOfferingService.FetchResponse;

@RestController
@RequestMapping("/buoi-04/offerings")
public class SingleOfferingController {
    private final SingleOfferingService service;

    public SingleOfferingController(SingleOfferingService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public FetchResponse get(@PathVariable Long id,
                             @RequestParam(defaultValue = "false") boolean includeDetail,
                             @RequestParam(defaultValue = "false") boolean fetchJoin) {
        return service.inspect(id, includeDetail, fetchJoin);
    }
}
