package com.myhealthprices.repository;

import com.myhealthprices.model.DrugDefinition;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface DrugDefinitionRepository extends ReactiveMongoRepository<DrugDefinition, String> {
    Flux<DrugDefinition> findByNdcContaining(String ndc);

    Mono<DrugDefinition> findByNdc(String ndc);

    Flux<DrugDefinition> findByNameRegex(String regex);

    Flux<DrugDefinition> findByName(String name);
}
