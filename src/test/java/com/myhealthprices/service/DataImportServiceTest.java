package com.myhealthprices.service;

import com.myhealthprices.repository.DrugDefinitionRepository;
import com.myhealthprices.repository.DrugPriceRepository;
import com.myhealthprices.repository.DrugSummaryRepository;
import com.myhealthprices.repository.MedicaidDrugUtilizationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class DataImportServiceTest {

    @Mock
    private MedicaidDrugUtilizationRepository rawRepo;
    @Mock
    private DrugDefinitionRepository definitionRepo;
    @Mock
    private DrugPriceRepository priceRepo;
    @Mock
    private DrugSummaryRepository summaryRepo;
    @Mock
    private ReactiveMongoTemplate mongoTemplate;

    private DataImportService dataImportService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        dataImportService = new DataImportService(rawRepo, definitionRepo, priceRepo, summaryRepo, mongoTemplate);
    }

    @Test
    public void testGetManufacturerName() {
        assertEquals("Eli Lilly and Company", dataImportService.getManufacturerName("00002"));
        assertEquals("Eli Lilly and Company", dataImportService.getManufacturerName("00777"));
        assertEquals("Pfizer", dataImportService.getManufacturerName("00008"));
        assertEquals("Pfizer", dataImportService.getManufacturerName("00069"));
        assertEquals("Pfizer", dataImportService.getManufacturerName("69"));
        assertEquals("Janssen (J&J)", dataImportService.getManufacturerName("50458"));
        assertEquals("Janssen (J&J)", dataImportService.getManufacturerName("57894"));
        assertEquals("Regeneron", dataImportService.getManufacturerName("61755"));
        assertEquals("Alnylam", dataImportService.getManufacturerName("71336"));
        assertEquals("Labeler 99999", dataImportService.getManufacturerName("99999"));
        assertEquals("Unknown", dataImportService.getManufacturerName(null));
    }
}
