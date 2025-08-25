package com.myhealthprices.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "drugs")
public class Drug {

    @Id
    private String id;

    @Field("drug_name")
    private String drugName;

    @Field("ndc")
    private String ndc;

    @Field("nadac_price")
    private Double nadacPrice;

    public Drug() {}

    public Drug(String drugName, String ndc, Double nadacPrice) {
        this.drugName = drugName;
        this.ndc = ndc;
        this.nadacPrice = nadacPrice;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDrugName() {
        return drugName;
    }

    public void setDrugName(String drugName) {
        this.drugName = drugName;
    }

    public String getNdc() {
        return ndc;
    }

    public void setNdc(String ndc) {
        this.ndc = ndc;
    }

    public Double getNadacPrice() {
        return nadacPrice;
    }

    public void setNadacPrice(Double nadacPrice) {
        this.nadacPrice = nadacPrice;
    }

    @Override
    public String toString() {
        return "Drug{" +
                "id='" + id + '\'' +
                ", drugName='" + drugName + '\'' +
                ", ndc='" + ndc + '\'' +
                ", nadacPrice=" + nadacPrice +
                '}';
    }
}
