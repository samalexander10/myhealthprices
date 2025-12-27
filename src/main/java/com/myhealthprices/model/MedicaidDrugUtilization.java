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

    @Field("Utilization Type")
    private String utilizationType;
    @Indexed
    @Field("State")
    private String state;
    @Indexed
    @Field("NDC")
    private String ndc;
    @Field("Labeler Code")
    private String labelerCode;
    @Field("Product Code")
    private String productCode;
    @Field("Package Size")
    private String packageSize;
    @Indexed
    @Field("Year")
    private Integer year;
    @Field("Quarter")
    private Integer quarter;
    @Field("Suppression Used")
    private Boolean suppressionUsed;
    @Field("Product Name")
    private String productName;
    @Field("Units Reimbursed")
    private Double unitsReimbursed;
    @Field("Number of Prescriptions")
    private Double numberOfPrescriptions;
    @Field("Total Amount Reimbursed")
    private Double totalAmountReimbursed;
    @Field("Medicaid Amount Reimbursed")
    private Double medicaidAmountReimbursed;
    @Field("Non Medicaid Amount Reimbursed")
    private Double nonMedicaidAmountReimbursed;

    private Double pricePerUnit;
}
