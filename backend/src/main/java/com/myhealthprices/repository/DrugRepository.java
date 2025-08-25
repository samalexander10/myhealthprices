package com.myhealthprices.repository;

import com.myhealthprices.model.Drug;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface DrugRepository extends ReactiveMongoRepository<Drug, String> {
    
    Flux<Drug> findByDrugNameContainingIgnoreCase(String drugName);
}
