package com.myhealthprices.repository;

import com.myhealthprices.model.MedicaidDrugUtilization;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

import reactor.core.publisher.Flux;

public interface MedicaidDrugUtilizationRepository extends ReactiveMongoRepository<MedicaidDrugUtilization, String> {
    Flux<MedicaidDrugUtilization> findByNdc(String ndc);
}
