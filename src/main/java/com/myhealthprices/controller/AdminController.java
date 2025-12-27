package com.myhealthprices.controller;

import com.myhealthprices.service.DataImportService;
import com.myhealthprices.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;
import java.util.Map;

@RestController
@RequestMapping("/api/v2/admin")
@RequiredArgsConstructor
public class AdminController {

    private final DataImportService importService;

    @PostMapping("/optimize")
    public Mono<String> optimize() {
        return importService.optimizeData()
                .then(Mono.just("Optimization triggered and completed successfully."));
    }

    @PostMapping("/import")
    public Mono<String> fullImport() {
        return importService.importData()
                .then(Mono.just("Full streaming import and optimization completed successfully."));
    }

    @PostMapping("/clear")
    public Mono<String> clear() {
        return importService.clearAll()
                .then(Mono.just("Database cleared."));
    }

    @GetMapping("/stats")
    public Mono<Map<String, Long>> getStats() {
        return importService.getStats();
    }

    @GetMapping("/summaries")
    public Flux<com.myhealthprices.model.DrugSummary> getSummaries() {
        return importService.getSummaries();
    }

    @GetMapping("/definitions")
    public Flux<com.myhealthprices.model.DrugDefinition> getDefinitions() {
        return importService.getDefinitions();
    }

    @GetMapping("/prices")
    public Flux<com.myhealthprices.model.DrugPrice> getPrices() {
        return importService.getDrugPrices();
    }

    @GetMapping("/raw")
    public Flux<com.myhealthprices.model.MedicaidDrugUtilization> getRaw() {
        return importService.getRaw();
    }

    @GetMapping("/raw/{ndc}")
    public Flux<com.myhealthprices.model.MedicaidDrugUtilization> getRawByNdc(@PathVariable String ndc) {
        return importService.getRawByNdc(ndc);
    }
}
