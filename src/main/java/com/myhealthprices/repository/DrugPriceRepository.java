package com.myhealthprices.repository;

import com.myhealthprices.model.DrugPrice;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import reactor.core.publisher.Flux;

import java.util.Collection;

public interface DrugPriceRepository extends ReactiveMongoRepository<DrugPrice, String> {
    Flux<DrugPrice> findByNdc(String ndc);

    Flux<DrugPrice> findByNdcAndStateIn(String ndc, Collection<String> states);
}
