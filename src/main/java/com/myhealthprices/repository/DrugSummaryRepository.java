package com.myhealthprices.repository;

import com.myhealthprices.model.DrugSummary;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface DrugSummaryRepository extends ReactiveMongoRepository<DrugSummary, String> {
    Mono<DrugSummary> findByNdc(String ndc);

    Flux<DrugSummary> findTop10ByOrderByAveragePriceDesc();

    Flux<DrugSummary> findTop10ByOrderByAveragePriceAsc();
}
