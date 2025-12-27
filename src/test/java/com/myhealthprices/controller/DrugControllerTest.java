package com.myhealthprices.controller;

import com.myhealthprices.model.DrugDefinition;
import com.myhealthprices.model.DrugSummary;
import com.myhealthprices.repository.DrugDefinitionRepository;
import com.myhealthprices.repository.DrugPriceRepository;
import com.myhealthprices.repository.DrugSummaryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;

public class DrugControllerTest {

    private WebTestClient webTestClient;

    @Mock
    private DrugDefinitionRepository definitionRepo;

    @Mock
    private DrugPriceRepository priceRepo;

    @Mock
    private DrugSummaryRepository summaryRepo;

    @InjectMocks
    private DrugController drugController;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        webTestClient = WebTestClient.bindToController(drugController).build();
    }

    @Test
    public void testSearchByNdc() {
        DrugDefinition def = new DrugDefinition();
        def.setNdc("00002150680");
        def.setName("MOUNJARO");

        when(definitionRepo.findByNdcContaining("00002")).thenReturn(Flux.just(def));

        webTestClient.get()
                .uri("/api/v2/drugs/search?q=00002")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(DrugDefinition.class)
                .hasSize(1)
                .contains(def);
    }

    @Test
    public void testSearchByNameExactMatch() {
        DrugDefinition def = new DrugDefinition();
        def.setName("ATORVASTAT");

        when(definitionRepo.findByNameRegex("(?i).*ATORVASTAT.*")).thenReturn(Flux.just(def));

        webTestClient.get()
                .uri("/api/v2/drugs/search?q=ATORVASTAT")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(DrugDefinition.class)
                .hasSize(1)
                .contains(def);
    }

    @Test
    public void testSearchByLongNameTruncationEdgeCase() {
        // Mock results: no result for full name "acetaminophen" (13 chars)
        when(definitionRepo.findByNameRegex("(?i).*acetaminophen.*")).thenReturn(Flux.empty());

        // But should have results for truncated "acetaminop" (10 chars)
        DrugDefinition def = new DrugDefinition();
        def.setName("ACETAMINOP");
        when(definitionRepo.findByNameRegex("(?i).*acetaminop.*")).thenReturn(Flux.just(def));

        webTestClient.get()
                .uri("/api/v2/drugs/search?q=acetaminophen")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(DrugDefinition.class)
                .hasSize(1)
                .contains(def);
    }

    @Test
    public void testGetExpensiveMedicationsEnriched() {
        DrugSummary summary = new DrugSummary();
        summary.setNdc("71336100101");
        summary.setAveragePrice(42426.46);
        summary.setTotalStates(1);

        DrugDefinition def = new DrugDefinition();
        def.setNdc("71336100101");
        def.setName("GIVLAARI");
        def.setManufacturer("Alnylam");

        when(summaryRepo.findTop10ByOrderByAveragePriceDesc()).thenReturn(Flux.just(summary));
        when(definitionRepo.findByNdc("71336100101")).thenReturn(Mono.just(def));

        webTestClient.get()
                .uri("/api/v2/drugs/expensive")
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(Map.class)
                .hasSize(1)
                .consumeWith(response -> {
                    List<Map> body = response.getResponseBody();
                    org.junit.jupiter.api.Assertions.assertNotNull(body);
                    Map item = body.get(0);
                    org.junit.jupiter.api.Assertions.assertEquals("GIVLAARI", item.get("name"));
                    org.junit.jupiter.api.Assertions.assertEquals("Alnylam", item.get("manufacturer"));
                    org.junit.jupiter.api.Assertions.assertEquals(42426.46, item.get("averagePrice"));
                });
    }

    @Test
    public void testGetSummaryWithZip() {
        DrugDefinition def = new DrugDefinition();
        def.setNdc("00002150680");
        def.setName("MOUNJARO");

        DrugSummary summary = new DrugSummary();
        summary.setNdc("00002150680");
        summary.setAveragePrice(100.0);

        when(definitionRepo.findByNdcContaining("00002150680")).thenReturn(Flux.just(def));
        when(summaryRepo.findByNdc("00002150680")).thenReturn(Mono.just(summary));

        webTestClient.get()
                .uri("/api/v2/drugs/00002150680/summary")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.definition.name").isEqualTo("MOUNJARO")
                .jsonPath("$.summary.averagePrice").isEqualTo(100.0);
    }
}
