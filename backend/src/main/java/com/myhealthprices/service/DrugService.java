package com.myhealthprices.service;

import com.myhealthprices.model.Drug;
import com.myhealthprices.repository.DrugRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
public class DrugService {

    @Autowired
    private DrugRepository drugRepository;

    public Flux<Drug> searchDrugsByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return Flux.empty();
        }
        
        String normalizedName = name.trim().toUpperCase();
        return drugRepository.findByDrugNameContainingIgnoreCase(normalizedName)
                .take(1);
    }
}
