package com.myhealthprices.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document(collection = "drug_summaries")
public class DrugSummary {
    @Id
    private String id;

    @Indexed(unique = true)
    private String ndc;

    @Indexed
    private Double averagePrice;
    private Double minPrice;
    private Double maxPrice;
    private Integer totalStates;

    private Instant lastUpdated = Instant.now();
}
