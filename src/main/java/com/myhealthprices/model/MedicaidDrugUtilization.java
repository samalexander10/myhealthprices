package com.myhealthprices.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Data
@Document(collection = "medicaid_drug_utilization")
public class MedicaidDrugUtilization {
    @Id
    private String id;

    @Field("ut")
    private String utilizationType;
    @Indexed
    @Field("st")
    private String state;
    @Indexed
    @Field("ndc")
    private String ndc;
    @Field("lc")
    private String labelerCode;
    @Field("pc")
    private String productCode;
    @Field("ps")
    private String packageSize;
    @Indexed
    @Field("y")
    private Integer year;
    @Field("q")
    private Integer quarter;
    @Field("su")
    private Boolean suppressionUsed;
    @Field("pn")
    private String productName;
    @Field("ur")
    private Double unitsReimbursed;
    @Field("nop")
    private Double numberOfPrescriptions;
    @Field("tar")
    private Double totalAmountReimbursed;
    @Field("mar")
    private Double medicaidAmountReimbursed;
    @Field("nmar")
    private Double nonMedicaidAmountReimbursed;

    private Double pricePerUnit;
}
