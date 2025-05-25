package org.springframework.samples.pubus.paper;

import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.FloatBuffer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException;
import org.springframework.data.util.Pair;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.pubus.exceptions.ResourceNotFoundException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.Tuple;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import com.knuddels.jtokkit.Encodings;
import com.knuddels.jtokkit.api.Encoding;

@Service
public class PaperFileServiceImpl implements PaperFileService {

    @Value("${openai.api.key}")
    private String openaiApiKey;

    @Autowired
    private PaperFileRepository paperFileRepository;
    
    @Autowired
    @Lazy
    private PaperService paperService;

    public PaperFileServiceImpl(PaperFileRepository paperFileRepository) {
        this.paperFileRepository = paperFileRepository;
    }

    @Transactional
    public PaperFile save(PaperFile paperFile) {
        return paperFileRepository.save(paperFile);
    }
    
    private static final int MAX_TOKENS = 7000;
    private static final Encoding ENCODING = Encodings.newDefaultEncodingRegistry()
        .getEncoding("cl100k_base")
        .orElseThrow(() -> new IllegalArgumentException("Encoding 'cl100k_base' not found"));

    @Override
    public PaperFile upload(MultipartFile file, Paper paper, Integer paperId) throws IOException {
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());

        // ADVERTENCIA CLAVE PARA OUTOFMEMORYERROR:
        // Si los archivos PDF son grandes (ej. > 5-10MB), esta línea es la causa principal
        // del OutOfMemoryError. Se recomienda NO guardar el 'data' directamente en la DB.
        // En su lugar, subir el archivo a un almacenamiento externo (S3, etc.)
        // y almacenar solo la URL/ruta en PaperFile.
        PaperFile paperFile;
        try (InputStream inputStream = file.getInputStream()) {
            paperFile = PaperFile.builder()
                .name(fileName)
                .type(file.getContentType())
                .data(inputStream.readAllBytes()) // <-- ¡CUIDADO! Esto carga todo el archivo en memoria.
                .paper(paper)
                .processingStatus("PROCESSING")
                .build();
        }

        PaperFile savedPaperFile = paperFileRepository.save(paperFile);

        // Ya que 'paper' viene del controlador, podría no estar totalmente gestionado por JPA
        // Recargarlo para asegurar que está en el contexto de persistencia si es necesario,
        // o asegúrate de que el 'paperService.updatePaper' lo maneje correctamente.
        Paper managedPaper = paperService.findPaperById(paperId); // Recargar el paper para asegurar contexto
        if (managedPaper != null) {
            List<PaperFile> paperFiles = managedPaper.getPaperFiles();
            if (paperFiles == null) {
                paperFiles = new ArrayList<>();
            }
            paperFiles.add(savedPaperFile);
            managedPaper.setPaperFiles(paperFiles);
            paperService.updatePaper(managedPaper, paperId); // Actualizar el paper gestionado
        }


        // Procesar embeddings de forma asíncrona
        // Pasamos el MultipartFile original para que el procesamiento asíncrono
        // pueda leer el InputStream del archivo sin depender del 'data' ya cargado
        processEmbeddingsAsync(savedPaperFile, file);

        return savedPaperFile;
    }

    @Async("taskExecutor")
    public CompletableFuture<Void> processEmbeddingsAsync(PaperFile paperFile, MultipartFile file) {
        try {
            Map<String, byte[]> embeddingMap = new HashMap<>();
            
            if ("application/pdf".equals(file.getContentType())) {
                // CAMBIO CLAVE: Extraer texto por trozos/páginas directamente
                // Esto evita cargar todo el texto del PDF como una única cadena gigante en memoria.
                List<String> pageTextChunks = extractTextFromPdfByPages(file); 
                
                for (String chunk : pageTextChunks) {
                    int tokenCount = estimateTokenCount(chunk);
                    if (tokenCount > MAX_TOKENS) {
                        List<String> subChunks = splitTextIntoChunks(chunk); // Si una página es muy larga, divídela más
                        for (String subChunk : subChunks) {
                            if (!subChunk.trim().isEmpty()) { // Evitar chunks vacíos
                                embeddingMap = addEmbedding(subChunk, embeddingMap);
                            }
                        }
                    } else {
                        if (!chunk.trim().isEmpty()) { // Evitar chunks vacíos
                            embeddingMap = addEmbedding(chunk, embeddingMap);
                        }
                    }
                }
            } else {
                // Si no es PDF, puedes manejar otros tipos de archivo aquí
                // o simplemente ignorar la generación de embeddings.
                // Por ejemplo, para archivos de texto, puedes leer el contenido directamente
                // y dividirlo en chunks si es muy grande.
                try (InputStream inputStream = file.getInputStream()) {
                    String fileContent = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
                    int tokenCount = estimateTokenCount(fileContent);
                    if (tokenCount > MAX_TOKENS) {
                        List<String> chunks = splitTextIntoChunks(fileContent);
                        for (String chunk : chunks) {
                            if (!chunk.trim().isEmpty()) {
                                embeddingMap = addEmbedding(chunk, embeddingMap);
                            }
                        }
                    } else {
                        if (!fileContent.trim().isEmpty()) {
                            embeddingMap = addEmbedding(fileContent, embeddingMap);
                        }
                    }
                }
            }

            paperFile.setEmbeddings(embeddingMap);
            paperFile.setProcessingStatus("COMPLETED");
            paperFileRepository.save(paperFile);
            
        } catch (Exception e) {
            paperFile.setProcessingStatus("FAILED");
            paperFileRepository.save(paperFile);
            // Considera usar un logger en lugar de printStackTrace en producción
            e.printStackTrace(); 
        }
        
        return CompletableFuture.completedFuture(null);
    }
    
    @Override
    public Map<String,byte[]> addEmbedding(String text, Map<String,byte[]> embeddingMap) {
        try {
            byte[] embedding = getEmbeddingFromOpenAI(text);
            embeddingMap.put(text, embedding);
        } catch (IOException e) {
            e.printStackTrace();
            // Podrías lanzar una excepción personalizada o manejar el error de otra forma
        }
        return embeddingMap;
    }

    /**
     * Extrae texto de un PDF, página por página o en grupos de páginas.
     * Esto ayuda a evitar cargar todo el texto de un PDF gigante en una sola String.
     * @param file El archivo MultipartFile.
     * @return Una lista de Strings, donde cada String es el texto de un chunk de páginas.
     * @throws IOException Si hay un error al leer el PDF.
     */
    public List<String> extractTextFromPdfByPages(MultipartFile file) throws IOException {
        List<String> pageTexts = new ArrayList<>();
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            
            // Puedes ajustar cuántas páginas procesar en cada "chunk"
            // Por ejemplo, procesar 1 página a la vez para máxima granularidad o 5-10 para menos llamadas a la API
            int pagesPerChunk = 1; // Un chunk por cada página para empezar
            
            int numberOfPages = document.getNumberOfPages();
            for (int i = 0; i < numberOfPages; i += pagesPerChunk) {
                int startPage = i + 1; // Las páginas en PDFBox son 1-indexed para start/end
                int endPage = Math.min(i + pagesPerChunk, numberOfPages);

                stripper.setStartPage(startPage);
                stripper.setEndPage(endPage);
                String text = stripper.getText(document);
                if (text != null && !text.trim().isEmpty()) {
                    pageTexts.add(text.trim());
                }
            }
        }
        return pageTexts;
    }
    
    // Método para interactuar con la API de OpenAI y obtener el embedding
    public byte[] getEmbeddingFromOpenAI(String text) throws IOException {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "text-embedding-ada-002");
        requestBody.put("input", text);

        ObjectMapper objectMapper = new ObjectMapper();
        String jsonRequestBody = objectMapper.writeValueAsString(requestBody);

        RestTemplate restTemplate = new RestTemplate();
        String url = "https://api.openai.com/v1/embeddings";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + openaiApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> request = new HttpEntity<>(jsonRequestBody, headers);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

        // CAMBIO CLAVE: Serializar los embeddings directamente a bytes (binario), no como string JSON
        byte[] embedding = convertEmbeddingToBinary(response.getBody());

        return embedding;
    }

    /**
     * Convierte la respuesta JSON de embeddings de OpenAI a un array de bytes binario.
     * Esto es mucho más eficiente que guardar la representación JSON de los flotantes.
     * @param responseBody La respuesta JSON completa de la API de OpenAI.
     * @return El array de bytes binario que representa los embeddings.
     * @throws IOException Si hay un error al procesar el JSON.
     */
    private byte[] convertEmbeddingToBinary(String responseBody) throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode embeddingNode = root.path("data").get(0).path("embedding");

        float[] embeddingArray = new float[embeddingNode.size()];
        for (int i = 0; i < embeddingNode.size(); i++) {
            embeddingArray[i] = (float) embeddingNode.get(i).asDouble(); // Usa asDouble() para mayor precisión
        }

        // Convertir float[] a byte[] de forma eficiente usando ByteBuffer
        ByteBuffer byteBuffer = ByteBuffer.allocate(embeddingArray.length * 4); // 4 bytes por float
        FloatBuffer floatBuffer = byteBuffer.asFloatBuffer();
        floatBuffer.put(embeddingArray);
        return byteBuffer.array();
    }

    /**
     * Deserializa un array de bytes binario de vuelta a un array de flotantes.
     * @param data El array de bytes binario.
     * @return El array de flotantes.
     */
    public float[] deserializeToFloatArray(byte[] data) {
        if (data == null || data.length == 0) {
            return new float[0];
        }
        ByteBuffer byteBuffer = ByteBuffer.wrap(data);
        FloatBuffer floatBuffer = byteBuffer.asFloatBuffer();
        float[] embedding = new float[floatBuffer.remaining()];
        floatBuffer.get(embedding);
        return embedding;
    }

    // El resto de tus métodos siguen igual

    private List<String> splitTextIntoChunks(String text) {
        List<String> chunks = new ArrayList<>();
        String[] sentences = text.split("(?<=[.!?])\\s+"); 
        
        StringBuilder currentChunk = new StringBuilder();
        int currentTokenCount = 0;
        
        for (String sentence : sentences) {
            int sentenceTokens = estimateTokenCount(sentence);
        
            if (currentTokenCount + sentenceTokens <= MAX_TOKENS) {
                currentChunk.append(sentence).append(" ");
                currentTokenCount += sentenceTokens;
            } else {
                if (currentChunk.length() > 0) {
                    chunks.add(currentChunk.toString().trim());
                }
                currentChunk = new StringBuilder(sentence).append(" ");
                currentTokenCount = sentenceTokens;
            }
        }    
        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString().trim());
        }
        
        return chunks;
    }

    private int estimateTokenCount(String text) {
        return ENCODING.encode(text).size();
    }

    public String getProcessingStatus(Integer fileId) {
        Optional<PaperFile> paperFile = paperFileRepository.findById(fileId);
        return paperFile.map(PaperFile::getProcessingStatus).orElse("NOT_FOUND");
    }

    public Pair<Integer,String> getContext(byte[] data, Integer userId) throws JsonProcessingException {
        List<PaperFile> files = getAllFilesByUserId(userId);
        float[] queryEmbedding = deserializeToFloatArray(data);
        String closestKey = "";
        Integer closesPaperFileId = 0;
        double bestSimilarity = -1.0;
        
        for(PaperFile file : files){
            if(file.getEmbeddings() != null){
                Map<String, byte[]> embeddings = file.getEmbeddings();
                for(Map.Entry<String, byte[]> entry : embeddings.entrySet()){
                    // Asegúrate de que deserializeToFloatArray se llama aquí correctamente
                    float[] dbEmbedding = deserializeToFloatArray(entry.getValue()); 
                    double similarity = cosineSimilarity(queryEmbedding, dbEmbedding);
                    if(similarity > bestSimilarity){
                        bestSimilarity = similarity;
                        closestKey = entry.getKey();
                        closesPaperFileId = file.getId();
                    }         
                } 
            }
        }
        Pair<Integer, String> result = Pair.of(closesPaperFileId, closestKey);
        return result;
    }

    public double cosineSimilarity(float[] vec1, float[] vec2) {
        if (vec1.length != vec2.length) throw new IllegalArgumentException("Vector sizes must match");
        double dot = 0.0, norm1 = 0.0, norm2 = 0.0;
        for (int i = 0; i < vec1.length; i++) {
            dot += (double)vec1[i] * vec2[i]; // Cast a double para evitar overflow antes de la suma
            norm1 += (double)vec1[i] * vec1[i];
            norm2 += (double)vec2[i] * vec2[i];
        }
        double denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
        if (denominator == 0) { // Manejar división por cero si algún vector es cero
            return 0.0;
        }
        return dot / denominator;
    }

    @Override
    public String[] getContextRecommended(List<byte[]> data) throws JsonProcessingException {
        List<Paper> papers = paperService.findAll().stream().toList();
        List<float[]> queryEmbeddings = new ArrayList<>();
        for(byte[] d : data){
            queryEmbeddings.add(deserializeToFloatArray(d));
        }
        String[] closestKey = new String[]{"", "", ""};
        double[] bestSimilarity = new double[]{-1.0, -1.0, -1.0};
        
        // Asumiendo que quieres los 3 mejores resultados, inicializa el array de bestSimilarity con Double.MIN_VALUE
        // y ordena después.
        // Mejor usar una lista de objetos (Pair<Double, String>) y ordenarla.
        // Por simplicidad, mantendremos la lógica original, pero podría mejorarse.

        for(Paper paper : papers){
            // Reiniciar el contador o el índice para cada paper si quieres los mejores globales.
            // Si quieres los 3 mejores por CADA queryEmbedding, la lógica es diferente.
            // La lógica actual parece buscar 3 mejores globales entre todos los papers para CADA queryEmbedding.
            // Aclaración: la variable 'counter' se reinicia para cada 'paper' lo que está mal
            // si el objetivo es encontrar 3 mejores entre todos los papers.
            // Debería ser un solo 'counter' que avanza por 'queryEmbeddings'.

            // Lo que parece que se quiere es: para cada uno de los queryEmbeddings (f),
            // encontrar el 'closestKey' y 'bestSimilarity' de entre TODOS los papers.
            // El 'counter' debe ser el índice del queryEmbedding actual.
            for(int k = 0; k < queryEmbeddings.size(); k++){
                float[] f = queryEmbeddings.get(k);
                if(paper.getEmbeddings() != null){
                    Map<String, byte[]> embeddings = paper.getEmbeddings();
                    for(Map.Entry<String, byte[]> entry : embeddings.entrySet()){
                        float[] dbEmbedding = deserializeToFloatArray(entry.getValue());
                        double similarity = cosineSimilarity(f, dbEmbedding);
                        if(similarity > bestSimilarity[k] && similarity < 1.0){
                            bestSimilarity[k] = similarity;
                            closestKey[k] = entry.getKey();
                        }         
                    }
                }
            }
        }
        return closestKey;
    }

    public List<PaperFile> getAllFilesByUserId(Integer userId) {
        return paperFileRepository.findByUserId(userId);
    }

    @Override
    public Optional<PaperFile> download(Integer id) throws NotFoundException {
        Optional<PaperFile> file = paperFileRepository.findById(id);
        if(file.isPresent()){
            return file;
        }
        throw new NotFoundException();
    }

    @Override
    public List<ResponseFile> getAllFilesByPaperId(Integer paperId) {    
        List<ResponseFile> files = paperFileRepository.findByPaperId(paperId).stream().map(dbFile -> {
            String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/v1/papers/{paperId}/files/")
                .path(dbFile.getId().toString())
                .toUriString();
            return ResponseFile.builder()
                .name(dbFile.getName())
                .url(fileDownloadUri)
                .type(dbFile.getType())
                // Si ya no guardas 'data' en PaperFile, dbFile.getData() será null.
                // Tendrías que obtener el tamaño de otra forma (e.g., al subir el archivo externo)
                .size(dbFile.getData() != null ? dbFile.getData().length : 0).build(); // Manejar null si 'data' no se guarda
        }).collect(Collectors.toList());

        return files;
    }

    @Override
    public void deletePaperFile(Integer id) {
        paperFileRepository.deleteById(id);
    }

    @Override
    public PaperFile getPaperFileById(Integer id) {
        return paperFileRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("File not found with ID: " + id));
    }

    @Override
    public String extractTextFromPdf(MultipartFile file) throws IOException {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'extractTextFromPdf'");
    }
}