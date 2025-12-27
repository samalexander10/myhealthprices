package com.myhealthprices.controller;

import com.myhealthprices.model.DrugDefinition;
import com.myhealthprices.model.DrugPrice;
import com.myhealthprices.model.DrugSummary;
import com.myhealthprices.repository.DrugDefinitionRepository;
import com.myhealthprices.repository.DrugPriceRepository;
import com.myhealthprices.repository.DrugSummaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v2/drugs")
@RequiredArgsConstructor
public class DrugController {

    private final DrugDefinitionRepository definitionRepo;
    private final DrugPriceRepository priceRepo;
    private final DrugSummaryRepository summaryRepo;

    // GET /api/v2/drugs/search?q=...
    @GetMapping("/search")
    public Flux<DrugDefinition> search(@RequestParam("q") String query) {
        if (query.matches("\\d+")) {
            // Is NDC
            return definitionRepo.findByNdcContaining(query).take(10);
        } else {
            // Is Name - case-insensitive regex search
            String cleanQuery = query.trim();
            Flux<DrugDefinition> results = definitionRepo.findByNameRegex("(?i).*" + cleanQuery + ".*");

            // If no results and query is long, it might be truncated in the DB
            return results.switchIfEmpty(Flux.defer(() -> {
                if (cleanQuery.length() > 10) {
                    String truncated = cleanQuery.substring(0, 10);
                    return definitionRepo.findByNameRegex("(?i).*" + truncated + ".*");
                }
                return Flux.empty();
            })).take(20);
        }
    }

    @GetMapping("/expensive")
    public Flux<Map<String, Object>> getExpensive() {
        return summaryRepo.findTop10ByOrderByAveragePriceDesc()
                .concatMap(this::enrichSummary);
    }

    @GetMapping("/cheap")
    public Flux<Map<String, Object>> getCheap() {
        return summaryRepo.findTop10ByOrderByAveragePriceAsc()
                .concatMap(this::enrichSummary);
    }

    private Mono<java.util.Map<String, Object>> enrichSummary(com.myhealthprices.model.DrugSummary summary) {
        return definitionRepo.findByNdc(summary.getNdc())
                .map(def -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("ndc", summary.getNdc());
                    map.put("name", def.getName());
                    map.put("manufacturer", def.getManufacturer() != null ? def.getManufacturer() : "Unknown");
                    map.put("averagePrice", summary.getAveragePrice());
                    map.put("minPrice", summary.getMinPrice());
                    map.put("maxPrice", summary.getMaxPrice());
                    map.put("totalStates", summary.getTotalStates());
                    return map;
                })
                .defaultIfEmpty(java.util.Collections.emptyMap()) // Temporarily use empty to avoid NPE
                .flatMap(map -> {
                    if (map.isEmpty()) {
                        java.util.Map<String, Object> fallback = new java.util.HashMap<>();
                        fallback.put("ndc", summary.getNdc());
                        fallback.put("name", "Medication " + summary.getNdc());
                        fallback.put("manufacturer", "Unknown");
                        fallback.put("averagePrice",
                                summary.getAveragePrice() != null ? summary.getAveragePrice() : 0.0);
                        fallback.put("minPrice", summary.getMinPrice() != null ? summary.getMinPrice() : 0.0);
                        fallback.put("maxPrice", summary.getMaxPrice() != null ? summary.getMaxPrice() : 0.0);
                        fallback.put("totalStates", summary.getTotalStates() != null ? summary.getTotalStates() : 0);
                        return Mono.just(fallback);
                    }
                    return Mono.just(map);
                });
    }

    // GET /api/v2/drugs/{ndc}/summary
    @GetMapping("/{ndc}/summary")
    public Mono<Map<String, Object>> getSummary(@PathVariable String ndc) {
        return Mono.zip(
                definitionRepo.findByNdcContaining(ndc).next(), // Using next() as findByNdcContaining returns Flux
                summaryRepo.findByNdc(ndc).defaultIfEmpty(new DrugSummary())).map(
                        tuple -> Map.of(
                                "definition", tuple.getT1(),
                                "summary", tuple.getT2()));
    }

    // GET /api/v2/drugs/{ndc}/prices?states=CA,TX
    @GetMapping("/{ndc}/prices")
    public Flux<DrugPrice> getPrices(@PathVariable String ndc, @RequestParam(required = false) String states) {
        if (states != null && !states.isBlank()) {
            return priceRepo.findByNdcAndStateIn(ndc,
                    Arrays.stream(states.split(","))
                            .map(String::trim)
                            .collect(Collectors.toList()));
        }
        return priceRepo.findByNdc(ndc);
    }
}
