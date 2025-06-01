package org.springframework.samples.pubus.paper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.util.Pair;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.samples.pubus.user.AuthoritiesRepository;
import org.springframework.samples.pubus.user.User;
import org.springframework.samples.pubus.user.UserRepository;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestPropertySource(locations = "classpath:application-test.properties")
@Sql(scripts = "/data.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
@Rollback(false) 
@ActiveProfiles("test")

public class RagTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PaperRepository paperRepository;

    @Autowired
    private PaperFileRepository paperFileRepository;

    @Autowired
    private PaperFileServiceImpl paperFileService;

    @MockBean
    private PaperService paperService;

    private List<TestDocument> testDocuments;
    private List<TestQuery> testQueries;


    
    @BeforeEach
    void setUp() throws IOException {
        initializeTestData();
    }
    
    private void initializeTestData() throws IOException {
        // Cargar archivos de prueba desde resources/test-documents
        testDocuments = loadTestDocuments();
        
        // Cargar queries de prueba desde resources/test-queries.json
        testQueries = loadTestQueries();
    }
    
    private List<TestDocument> loadTestDocuments() throws IOException {
        // Esta implementación asume que tienes un directorio de recursos con documentos PDF de prueba
        List<TestDocument> documents = new ArrayList<>();
        Path testDocsPath = Paths.get("src/test/resources/test-documents");
        
        if (Files.exists(testDocsPath)) {
            Files.list(testDocsPath).filter(path -> path.toString().endsWith(".pdf")).forEach(path -> {
                try {
                    File file = path.toFile();
                    String name = file.getName();
                    String content = new String(Files.readAllBytes(path));
                    documents.add(new TestDocument(name, content, path));
                } catch (IOException e) {
                    e.printStackTrace();
                }
            });
        } else {
            // Crear un documento de prueba si no existen
            TestDocument testDoc = new TestDocument(
                "test-document.pdf",
                "Este es un documento de prueba para el sistema RAG con embeddings.",
                null
            );
            documents.add(testDoc);
        }
        
        return documents;
    }
    
    private List<TestQuery> loadTestQueries() throws IOException {
        // Cargar consultas de prueba desde un archivo JSON
        List<TestQuery> queries = new ArrayList<>();
        Path queriesPath = Paths.get("src/test/resources/test-querys.json");
        
        if (Files.exists(queriesPath)) {
            String content = new String(Files.readAllBytes(queriesPath));
            ObjectMapper mapper = new ObjectMapper();
            queries = Arrays.asList(mapper.readValue(content, TestQuery[].class));
        } else {
            // Crear consultas de prueba si no existe el archivo
            queries.add(new TestQuery("¿Qué son los embeddings?", Arrays.asList("test-document.pdf"), 0.8));
            queries.add(new TestQuery("Explica el sistema RAG", Arrays.asList("test-document.pdf"), 0.7));
        }
        
        return queries;
    }
    
    // Clases para datos de prueba
    
    static class TestDocument {
        private String name;
        private String content;
        private Path path;
        
        public TestDocument(String name, String content, Path path) {
            this.name = name;
            this.content = content;
            this.path = path;
        }
        
        public String getName() { return name; }
        public String getContent() { return content; }
        public Path getPath() { return path; }
    }
    
    static class TestQuery {
        private String query;
        private List<String> expectedDocuments;
        private double minSimilarityThreshold;
        
        public TestQuery() {}
        
        public TestQuery(String query, List<String> expectedDocuments, double minSimilarityThreshold) {
            this.query = query;
            this.expectedDocuments = expectedDocuments;
            this.minSimilarityThreshold = minSimilarityThreshold;
        }
        
        public String getQuery() { return query; }
        public List<String> getExpectedDocuments() { return expectedDocuments; }
        public double getMinSimilarityThreshold() { return minSimilarityThreshold; }
        
        public void setQuery(String query) { this.query = query; }
        public void setExpectedDocuments(List<String> expectedDocuments) { this.expectedDocuments = expectedDocuments; }
        public void setMinSimilarityThreshold(double minSimilarityThreshold) { this.minSimilarityThreshold = minSimilarityThreshold; }
    }

    @Test
    void testRAGPerformanceWith100PDFs() throws IOException {
    Integer userId = 2;
    Path testDocsPath = Paths.get("src/test/resources/test-documents");
    assertTrue(Files.exists(testDocsPath), "El directorio de documentos de prueba no existe");

    List<TestDocument> testDocuments = new ArrayList<>();
    Files.list(testDocsPath).filter(path -> path.toString().endsWith(".pdf")).forEach(path -> {
        try {
            String content = paperFileService.extractTextFromPdf(new MockMultipartFile(
                path.getFileName().toString(),
                Files.readAllBytes(path)
            ));
            testDocuments.add(new TestDocument(path.getFileName().toString(), content, path));
        } catch (IOException e) {
            e.printStackTrace();
        }
    });

    assertEquals(100, testDocuments.size(), "Debe haber exactamente 100 documentos de prueba");
    List<PaperFile> paperFilesByUser = paperFileRepository.findByUserId(userId);
     if (paperFilesByUser.isEmpty()) {
        Paper paper = paperRepository.findById(1).orElseThrow(() -> new RuntimeException("Paper no encontrado"));
        List<PaperFile> paperFiles = new ArrayList<>();
        for (int i = 0; i < testDocuments.size(); i++) {
        TestDocument doc = testDocuments.get(i);

        // Crear un PaperFile para cada documento
        PaperFile paperFile = new PaperFile();
        paperFile.setId(i + 1); // Asignar un ID único
        paperFile.setName(doc.getName());
        paperFile.setType("application/pdf");
        paperFile.setData(doc.getContent().getBytes(StandardCharsets.UTF_8)); // Guardar el contenido como bytes
        paperFile.setPaper(paper); // Asociar el Paper con el PaperFile

        // Crear embeddings reales para el contenido del documento
        byte[] embedding = paperFileService.getEmbeddingFromOpenAI(doc.getContent());
        
        Map<String, byte[]> embeddingMap = new HashMap<>();
        embeddingMap.put(doc.getContent(), embedding);
        paperFile.setEmbeddings(embeddingMap);
        paperFiles.add(paperFile);
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); // Restore interrupted status
            throw new RuntimeException("Thread sleep was interrupted", e);
        }
    }
      paperFileRepository.saveAll(paperFiles);
    
    }
    
    // Cargar consultas de prueba
    Path queriesPath = Paths.get("src/test/resources/test-queries.json");
    assertTrue(Files.exists(queriesPath), "El archivo de consultas de prueba no existe");

    ObjectMapper mapper = new ObjectMapper();
    List<TestQuery> testQueries = Arrays.asList(mapper.readValue(Files.readAllBytes(queriesPath), TestQuery[].class));

    // Métricas de rendimiento
    int totalQueries = testQueries.size();
    int correctRetrievals = 0;
    int partialRetrievals = 0;
    int errors = 0;

    System.out.println("\n--- RAG PERFORMANCE TEST ---");
    System.out.println("Total Queries: " + totalQueries);

    for (TestQuery query : testQueries) {
        try {
            // Obtener embedding para la consulta
            byte[] queryEmbedding = paperFileService.getEmbeddingFromOpenAI(query.getQuery());

            // Obtener el contexto más relevante
            Pair<Integer, String> result = paperFileService.getContext(queryEmbedding, 2);

            // Verificar si el resultado es el esperado
            PaperFile retrievedFile = paperFileService.getPaperFileById(result.getFirst());
            String retrievedFileName = retrievedFile.getName();

            boolean isExactMatch = query.getExpectedDocuments().contains(retrievedFileName);
            boolean isPartialMatch = query.getExpectedDocuments().stream()
                .anyMatch(expectedDoc -> retrievedFileName.contains(expectedDoc) || expectedDoc.contains(retrievedFileName));

            System.out.println("Query: " + query.getQuery());
            System.out.println("Retrieved: " + retrievedFileName);
            System.out.println("Expected: " + String.join(", ", query.getExpectedDocuments()));

            if (isExactMatch) {
                correctRetrievals++;
                System.out.println("Result: ✅ EXACT MATCH");
            } else if (isPartialMatch) {
                partialRetrievals++;
                System.out.println("Result: ⚠️ PARTIAL MATCH");
            } else {
                errors++;
                System.out.println("Result: ❌ NO MATCH");
            }
            System.out.println("---");

        } catch (Exception e) {
            errors++;
            System.out.println("Query: " + query.getQuery());
            System.out.println("Result: ❌ ERROR - " + e.getMessage());
            System.out.println("---");
        }
    }

    // Calcular métricas
    double accuracy = (double) correctRetrievals / totalQueries;
    double partialRate = (double) partialRetrievals / totalQueries;
    double errorRate = (double) errors / totalQueries;
    int truePositives = correctRetrievals;
    int falsePositives = partialRetrievals; // o errores, según definición
    int falseNegatives = errors;
    double precision = truePositives / (double) (truePositives + falsePositives);
    double recall = truePositives / (double) (truePositives + falseNegatives);
    double f1 = 2 * (precision * recall) / (precision + recall);

    System.out.println("\n--- RAG PERFORMANCE METRICS ---");
    System.out.println("Total Queries: " + totalQueries);
    System.out.println("Exact Matches: " + correctRetrievals);
    System.out.println("Partial Matches: " + partialRetrievals);
    System.out.println("Errors: " + errors);
    System.out.println("Accuracy: " + String.format("%.2f", accuracy * 100) + "%");
    System.out.println("Partial Retrieval Rate: " + String.format("%.2f", partialRate * 100) + "%");
    System.out.println("Error Rate: " + String.format("%.2f", errorRate * 100) + "%");
    System.out.println(String.format("Precision: %.2f%%", precision * 100));
    System.out.println(String.format("Recall: %.2f%%", recall * 100));
    System.out.println(String.format("F1 Score: %.2f%%", f1 * 100));

    Map<String, Object> metrics = new HashMap<>();
    metrics.put("totalQueries", totalQueries);
    metrics.put("exactMatches", correctRetrievals);
    metrics.put("partialMatches", partialRetrievals);
    metrics.put("errors", errors);
    metrics.put("accuracy", accuracy);
    metrics.put("partialRetrievalRate", partialRate);
    metrics.put("errorRate", errorRate);
    metrics.put("precision", precision);
    metrics.put("recall", recall);
    metrics.put("f1Score", f1);

    ObjectMapper mapper2 = new ObjectMapper();
    try {
        // Ajusta la ruta si es necesario, esta es relativa al directorio raíz del proyecto
        File outputFile = new File("src/test/resources/results/metrics.json");
        outputFile.getParentFile().mkdirs(); // crear carpetas si no existen
        mapper2.writerWithDefaultPrettyPrinter().writeValue(outputFile, metrics);
    } catch (IOException e) {
        e.printStackTrace();
    }

    // Assertiones para garantizar un mínimo de calidad
    assertTrue(accuracy >= 0.5, "La precisión debe ser al menos del 50%");
    assertTrue(errorRate <= 0.2, "La tasa de error no debe superar el 20%");
    }
}
