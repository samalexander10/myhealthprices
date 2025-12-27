package com.myhealthprices;

import com.myhealthprices.repository.DrugDefinitionRepository;
import com.myhealthprices.service.DataImportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ApplicationTests {

    @Autowired
    private DataImportService importService;

    @Autowired
    private DrugDefinitionRepository definitionRepo;

    @Test
    void contextLoads() {
        assertThat(importService).isNotNull();
        assertThat(definitionRepo).isNotNull();
    }
}
