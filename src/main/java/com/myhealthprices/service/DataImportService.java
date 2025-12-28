package com.myhealthprices.service;

import com.myhealthprices.model.*;
import com.myhealthprices.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.ArithmeticOperators;

import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.FileReader;
import java.io.Reader;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataImportService {

    private final MedicaidDrugUtilizationRepository rawRepo;
    private final DrugDefinitionRepository definitionRepo;
    private final DrugPriceRepository priceRepo;
    private final DrugSummaryRepository summaryRepo;
    private final ReactiveMongoTemplate mongoTemplate;

    protected String getManufacturerName(String labeler) {
        if (labeler == null)
            return "Unknown";
        return switch (labeler) {
            case "00002", "00777" -> "Eli Lilly and Company";
            case "00007", "00029", "00173", "7" -> "GlaxoSmithKline";
            case "00008", "00009", "00025", "00069", "00071", "00409", "59762", "13", "25", "69" -> "Pfizer";
            case "00310", "00186", "186", "310" -> "AstraZeneca";
            case "00013" -> "Pharmacia & Upjohn";
            case "00024", "00039", "00068", "00088", "00091", "00955", "24", "39", "68", "88", "91" -> "Sanofi";
            case "00026" -> "Bayer";
            case "00032", "00456", "32", "456", "51" -> "AbbVie";
            case "00037", "37" -> "Meda Pharmaceuticals";
            case "00046", "46" -> "Wyeth";
            case "00052", "52" -> "Organon";
            case "00054", "54" -> "Hikma Pharmaceuticals";
            case "00056", "56" -> "DuPont";
            case "00065", "65" -> "Alcon";
            case "00067", "00078", "00216", "00781", "00185", "51079", "61314", "66758", "67", "78", "216", "781",
                    "185", "1167" ->
                "Novartis / Sandoz";
            case "00074", "74" -> "Abbott Laboratories";
            case "00085", "85" -> "Merck & Co.";
            case "00093", "00172", "00555", "50111", "93", "172", "555" -> "Teva Pharmaceuticals";
            case "00169", "169" -> "Novo Nordisk";
            case "00187", "187" -> "Bausch Health";
            case "00228", "00472", "00591", "52544", "228" -> "Actavis (Teva)";
            case "00245", "00832", "245" -> "Upsher-Smith";
            case "00378", "378" -> "Mylan (Viatris)";
            case "00406", "11695", "406" -> "Mallinckrodt";
            case "00527", "527" -> "Lannett Company";
            case "00603", "603" -> "Par Pharmaceutical";
            case "00713", "713" -> "Cosette Pharmaceuticals";
            case "00904", "904" -> "Major Pharmaceuticals";
            case "00990", "990" -> "ICU Medical";
            case "10019" -> "Baxter";
            case "16714" -> "NorthStar Rx";
            case "31722" -> "Camber Pharmaceuticals";
            case "42291" -> "AvKARE";
            case "43598", "55111" -> "Dr. Reddy's Laboratories";
            case "50242", "4" -> "Genentech (Roche)";
            case "50458", "57894" -> "Janssen (J&J)";
            case "51672" -> "Taro Pharmaceuticals";
            case "55513" -> "Amgen";
            case "57664" -> "Sun Pharmaceutical";
            case "60219", "65162", "69238" -> "Amneal Pharmaceuticals";
            case "60300", "63739" -> "McKesson";
            case "60505" -> "Apotex Corp";
            case "61755" -> "Regeneron";
            case "62175" -> "Krka";
            case "62332", "68001" -> "Alembic Pharmaceuticals";
            case "63323" -> "Fresenius Kabi";
            case "64380", "68382" -> "Zydus Pharmaceuticals";
            case "65862" -> "Aurobindo Pharma";
            case "68462" -> "Glenmark Pharmaceuticals";
            case "68682" -> "Oceanside Pharmaceuticals";
            case "69097" -> "Cipla USA";
            case "70114" -> "Coherus BioSciences";
            case "70518" -> "RemedyRepack";
            case "71336" -> "Alnylam";
            case "76282" -> "Exelan Pharmaceuticals";
            default -> "Labeler " + labeler;
        };
    }

    public Mono<Void> importData() {
        Path path = Paths.get("medicaid-sdud-2024.csv");
        if (!path.toFile().exists()) {
            log.warn("medicaid-sdud-2024.csv not found, skipping import.");
            return Mono.empty();
        }

        return rawRepo.deleteAll()
                .then(definitionRepo.deleteAll())
                .then(priceRepo.deleteAll())
                .then(summaryRepo.deleteAll())
                .then(Mono.fromCallable(() -> {
                    log.info("Opening CSV for streaming...");
                    Reader reader = new FileReader(path.toFile());
                    return new CSVParser(reader, CSVFormat.DEFAULT.withHeader());
                }).flatMapMany(parser -> Flux.fromIterable((Iterable<CSVRecord>) parser))
                        .map(this::mapRowToUtilization)
                        .filter(item -> item != null)
                        .buffer(500) // Smaller buffer to save memory
                        .flatMap(batch -> rawRepo.saveAll((Iterable<MedicaidDrugUtilization>) batch), 2) // Lower
                                                                                                         // concurrency
                        .then())
                .doOnSuccess(x -> log.info("Raw import completed. Starting optimization..."))
                .flatMap(x -> optimizeData())
                .then(Mono.defer(() -> {
                    log.info("Optimization complete. Deleting raw data to free space...");
                    return rawRepo.deleteAll();
                }))
                .onErrorResume(e -> {
                    log.error("Import failed", e);
                    return Mono.error(e);
                });
    }

    public Mono<Void> clearAll() {
        return Mono.when(
                mongoTemplate.dropCollection("medicaid_drug_utilization"),
                mongoTemplate.dropCollection("drug_definitions"),
                mongoTemplate.dropCollection("drug_prices"),
                mongoTemplate.dropCollection("drug_summaries")).log("Clearing all data").then();
    }

    public Flux<DrugSummary> getSummaries() {
        return summaryRepo.findAll().take(5);
    }

    public Flux<DrugDefinition> getDefinitions() {
        return definitionRepo.findAll().take(5);
    }

    public Flux<DrugPrice> getDrugPrices() {
        return priceRepo.findAll().take(5);
    }

    public Flux<MedicaidDrugUtilization> getRawByNdc(String ndc) {
        return rawRepo.findByNdc(ndc);
    }

    public Flux<MedicaidDrugUtilization> getRaw() {
        return rawRepo.findAll().take(5);
    }

    public Mono<java.util.Map<String, Long>> getStats() {
        return Mono.zip(
                rawRepo.count(),
                definitionRepo.count(),
                priceRepo.count(),
                summaryRepo.count()).map(
                        tuple -> java.util.Map.of(
                                "raw", tuple.getT1(),
                                "definitions", tuple.getT2(),
                                "prices", tuple.getT3(),
                                "summaries", tuple.getT4()));
    }

    public Mono<Void> optimizeData() {
        return Mono.when(
                generateDrugDefinitions(),
                generateDrugPrices().then(generateDrugSummaries()));
    }

    private Mono<Void> generateDrugDefinitions() {
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.group("ndc")
                        .first("pn").as("name")
                        .first("ndc").as("ndc")
                        .first("lc").as("labeler")
                        .first("ps").as("packageSize"))
                .withOptions(Aggregation.newAggregationOptions().allowDiskUse(true).build());

        return definitionRepo.deleteAll().then(
                mongoTemplate.aggregate(agg, "medicaid_drug_utilization", DrugDefinition.class)
                        .collectList()
                        .flatMap(defs -> {
                            defs.forEach(d -> {
                                if (d.getLabeler() != null) {
                                    d.setManufacturer(getManufacturerName(d.getLabeler()));
                                }
                            });
                            return definitionRepo.saveAll(defs).then();
                        }));
    }

    private Mono<Void> generateDrugPrices() {
        Aggregation agg = Aggregation.newAggregation(
                // Filter out records with invalid units for calculations
                Aggregation.match(Criteria.where("ur").gt(0.0)),
                // Project fields directly (they are already typed correctly in the DB)
                Aggregation.project()
                        .and("ndc").as("ndc")
                        .and("st").as("state")
                        .and("y").as("year")
                        .and("q").as("quarter")
                        .and("tar").as("totalAmt")
                        .and("ur").as("units"),
                Aggregation.project("ndc", "state", "year", "quarter")
                        .and(ArithmeticOperators.Divide.valueOf("totalAmt")
                                .divideBy("units"))
                        .as("price"),
                Aggregation.sort(Sort.Direction.DESC, "year", "quarter"),
                Aggregation.group("ndc", "state")
                        .first("ndc").as("ndc")
                        .first("state").as("state")
                        .first("price").as("price")
                        .first("year").as("year")
                        .first("quarter").as("quarter"),
                Aggregation.out("drug_prices"))
                .withOptions(Aggregation.newAggregationOptions().allowDiskUse(true).build());
        return mongoTemplate.aggregate(agg, "medicaid_drug_utilization", DrugPrice.class).then();
    }

    private Mono<Void> generateDrugSummaries() {
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.group("ndc")
                        .first("ndc").as("ndc")
                        .avg("price").as("averagePrice")
                        .min("price").as("minPrice")
                        .max("price").as("maxPrice")
                        .count().as("totalStates"),
                Aggregation.out("drug_summaries"))
                .withOptions(Aggregation.newAggregationOptions().allowDiskUse(true).build());
        return mongoTemplate.aggregate(agg, "drug_prices", DrugSummary.class).then();
    }

    private MedicaidDrugUtilization mapRowToUtilization(CSVRecord row) {
        try {
            MedicaidDrugUtilization u = new MedicaidDrugUtilization();
            u.setUtilizationType(row.get("Utilization Type"));
            u.setState(row.get("State"));
            u.setNdc(row.get("NDC"));
            u.setLabelerCode(row.get("Labeler Code"));
            u.setProductCode(row.get("Product Code"));
            u.setPackageSize(row.get("Package Size"));
            u.setYear(Integer.parseInt(row.get("Year")));
            u.setQuarter(Integer.parseInt(row.get("Quarter")));
            u.setSuppressionUsed(Boolean.parseBoolean(row.get("Suppression Used")));
            u.setProductName(row.get("Product Name"));

            u.setUnitsReimbursed(parseDouble(row.get("Units Reimbursed")));
            u.setTotalAmountReimbursed(parseDouble(row.get("Total Amount Reimbursed")));

            if (u.getUnitsReimbursed() > 0) {
                u.setPricePerUnit(u.getTotalAmountReimbursed() / u.getUnitsReimbursed());
            } else {
                u.setPricePerUnit(0.0);
            }
            return u;
        } catch (Exception e) {
            return null;
        }
    }

    private Double parseDouble(String val) {
        if (val == null || val.isEmpty())
            return 0.0;
        return Double.parseDouble(val);
    }
}
