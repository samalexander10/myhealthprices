package com.myhealthprices.util;

import com.myhealthprices.model.Drug;
import com.myhealthprices.repository.DrugRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataImporter {

    @Autowired
    private DrugRepository drugRepository;

    public Mono<Void> importNadacData(String csvFilePath) {
        return drugRepository.deleteAll()
                .then(Mono.fromCallable(() -> readCsvFile(csvFilePath)))
                .flatMapMany(Flux::fromIterable)
                .flatMap(drugRepository::save)
                .then()
                .doOnSuccess(unused -> System.out.println("Successfully imported NADAC data"))
                .doOnError(error -> System.err.println("Error importing NADAC data: " + error.getMessage()));
    }

    private List<Drug> readCsvFile(String csvFilePath) throws IOException {
        List<Drug> drugs = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new FileReader(csvFilePath))) {
            String line = reader.readLine(); // Skip header
            
            while ((line = reader.readLine()) != null) {
                String[] fields = parseCsvLine(line);
                
                if (fields.length >= 3) {
                    String drugName = getFieldValue(fields, "NDC Description", "NDC_Description", "Drug Name");
                    String ndc = getFieldValue(fields, "NDC", "ndc");
                    String priceStr = getFieldValue(fields, "NADAC_Per_Unit", "NADAC Per Unit");
                    
                    if (drugName != null && !drugName.trim().isEmpty() && 
                        ndc != null && !ndc.trim().isEmpty()) {
                        
                        Double price = 0.0;
                        try {
                            price = Double.parseDouble(priceStr);
                        } catch (NumberFormatException e) {
                            price = 0.0;
                        }
                        
                        drugs.add(new Drug(drugName.trim(), ndc.trim(), price));
                    }
                }
            }
        }
        
        return drugs;
    }

    private String[] parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder currentField = new StringBuilder();
        
        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                fields.add(currentField.toString());
                currentField = new StringBuilder();
            } else {
                currentField.append(c);
            }
        }
        fields.add(currentField.toString());
        
        return fields.toArray(new String[0]);
    }

    private String getFieldValue(String[] fields, String... possibleNames) {
        if (fields.length > 0) {
            return fields[0];
        }
        return null;
    }
}
