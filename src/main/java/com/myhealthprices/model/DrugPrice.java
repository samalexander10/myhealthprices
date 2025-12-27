package com.myhealthprices.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document(collection = "drug_prices")
@CompoundIndex(def = "{'ndc': 1, 'state': 1}", unique = true)
public class DrugPrice {
    @Id
    private String id;

    private String ndc;
    private String state;
    private Double price;
    private Integer year;
    private Integer quarter;

    private Instant lastUpdated = Instant.now();
}
