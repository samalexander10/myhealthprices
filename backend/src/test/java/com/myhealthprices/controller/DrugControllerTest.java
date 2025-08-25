package com.myhealthprices.controller;

import com.myhealthprices.model.Drug;
import com.myhealthprices.service.DrugService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@WebFluxTest(DrugController.class)
class DrugControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private DrugService drugService;

    @Test
    void testSearchDrugs_Success() {
        Drug drug = new Drug("IBUPROFEN 200 MG CAPSULE", "12345-678-90", 5.99);
        when(drugService.searchDrugsByName(anyString())).thenReturn(Flux.just(drug));

        webTestClient.get()
                .uri("/api/drugs?name=ibuprofen")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$[0].drugName").isEqualTo("IBUPROFEN 200 MG CAPSULE")
                .jsonPath("$[0].ndc").isEqualTo("12345-678-90")
                .jsonPath("$[0].nadacPrice").isEqualTo(5.99);
    }

    @Test
    void testSearchDrugs_NotFound() {
        when(drugService.searchDrugsByName(anyString())).thenReturn(Flux.empty());

        webTestClient.get()
                .uri("/api/drugs?name=nonexistent")
                .exchange()
                .expectStatus().isNotFound()
                .expectBody()
                .jsonPath("$.error").isEqualTo("No drug data found");
    }

    @Test
    void testSearchDrugs_MissingName() {
        webTestClient.get()
                .uri("/api/drugs")
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.error").isEqualTo("Drug name is required");
    }

    @Test
    void testHealthCheck() {
        webTestClient.get()
                .uri("/api/health")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.status").isEqualTo("OK");
    }
}
