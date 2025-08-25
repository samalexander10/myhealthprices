package com.myhealthprices.controller;

import com.myhealthprices.model.Drug;
import com.myhealthprices.service.DrugService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DrugController {

    @Autowired
    private DrugService drugService;

    @GetMapping("/drugs")
    public Mono<ResponseEntity<?>> searchDrugs(@RequestParam(required = false) String name) {
        if (name == null || name.trim().isEmpty()) {
            return Mono.just(ResponseEntity.badRequest()
                    .body(Map.of("error", "Drug name is required")));
        }

        return drugService.searchDrugsByName(name)
                .collectList()
                .map(drugs -> {
                    if (drugs.isEmpty()) {
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(Map.of("error", "No drug data found"));
                    }
                    return ResponseEntity.ok(drugs);
                })
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Internal server error")));
    }

    @GetMapping("/health")
    public Mono<ResponseEntity<Map<String, String>>> healthCheck() {
        return Mono.just(ResponseEntity.ok(Map.of("status", "OK")));
    }
}
