package com.myhealthprices.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document(collection = "drug_definitions")
public class DrugDefinition {
    @Id
    private String id;

    @Indexed(unique = true)
    private String ndc;

    @TextIndexed
    private String name;

    private String manufacturer;
    private String genericName;
    private String labeler;
    private String strength;
    private String dosageForm;
    private String packageSize;

    private Instant lastUpdated = Instant.now();

    // For manual creation
    public DrugDefinition copy() {
        DrugDefinition d = new DrugDefinition();
        d.id = this.id;
        d.ndc = this.ndc;
        d.name = this.name;
        // set others...
        return d;
    }
}
