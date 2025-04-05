package org.springframework.samples.pubus.paper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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


@Service
public class PaperFileServiceImpl implements PaperFileService {

    @Value("${openai.api.key}") // Tu clave API de OpenAI
    private String openaiApiKey;

    @Autowired
    private PaperFileRepository paperFileRepository;
    
    @Autowired
    @Lazy
    private PaperService paperService;

    @Transactional
    public PaperFile save(PaperFile paperFile) {
        return paperFileRepository.save(paperFile);
    }
    private static final int MAX_TOKENS = 7000;


    @Override
    public PaperFile upload(MultipartFile file, Paper paper, Integer paperId) throws IOException {
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());

       PaperFile paperFile = PaperFile.builder()
       .name(fileName)
       .type(file.getContentType())
       .data(file.getBytes())
       .paper(paper)
       .build();


        //Embedding
        Map<String, byte[]> embeddingMap = new HashMap<>();
        if(file.getContentType().equals("application/pdf")){
            String extractedText = extractTextFromPdf(file);
            int tokenCount = estimateTokenCount(extractedText);
            if (tokenCount > MAX_TOKENS){
                List<String> chunks = splitTextIntoChunks(extractedText);
                for (String chunk : chunks) {
                    embeddingMap = addEmbedding(chunk, embeddingMap);
                }
            }else{
                embeddingMap = addEmbedding(extractedText, embeddingMap);
            }
            
        }
        paperFile.setEmbeddings(embeddingMap);
        List<PaperFile> paperFiles = paper.getPaperFiles();
        paperFiles.add(paperFile);
        paper.setPaperFiles(paperFiles);
        paperService.updatePaper(paper, paperId);

       return paperFileRepository.save(paperFile);
    }
    @Override
    public Map<String,byte[]> addEmbedding(String text, Map<String,byte[]> embeddingMap) {
        try {
            byte[] embedding = getEmbeddingFromOpenAI(text);
            embeddingMap.put(text, embedding);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return embeddingMap;
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
                .size(dbFile.getData().length).build();

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

    // Método para extraer texto del PDF
    private String extractTextFromPdf(MultipartFile file) throws IOException {
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }
    
    // Método para interactuar con la API de OpenAI y obtener el embedding
    public byte[] getEmbeddingFromOpenAI(String text) throws IOException {
        // Crear el cuerpo de la solicitud como un mapa de datos
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "text-embedding-ada-002");
        requestBody.put("input", text);

        // Convertir el mapa a JSON utilizando ObjectMapper
        ObjectMapper objectMapper = new ObjectMapper();
        String jsonRequestBody = objectMapper.writeValueAsString(requestBody);

        RestTemplate restTemplate = new RestTemplate();
        String url = "https://api.openai.com/v1/embeddings";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + openaiApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> request = new HttpEntity<>(jsonRequestBody, headers);

        // Hacer la solicitud y obtener la respuesta
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

        // Procesar la respuesta
        byte[] embedding = convertEmbeddingToBinary(response.getBody());

        return embedding; // Retornar el array binario
    }

    private byte[] convertEmbeddingToBinary(String responseBody) throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode embeddingNode = root.path("data").get(0).path("embedding");
        String jsonString = embeddingNode.toString();
        byte[] jsonBytes = jsonString.getBytes(StandardCharsets.UTF_8);
        return jsonBytes;
    }

    private List<String> splitTextIntoChunks(String text) {
        List<String> chunks = new ArrayList<>();
        String[] sentences = text.split("(?<=[.!?])\\s+"); // Divide en frases
        
        StringBuilder currentChunk = new StringBuilder();
        int currentTokenCount = 0;
        
        for (String sentence : sentences) {
            int sentenceTokens = estimateTokenCount(sentence);
        
            if (currentTokenCount + sentenceTokens > MAX_TOKENS) {
                chunks.add(currentChunk.toString());
                currentChunk = new StringBuilder();
                currentTokenCount = 0;
            }
        
            currentChunk.append(sentence).append(" ");
            currentTokenCount += sentenceTokens;
        }
        
        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString());
        }
        
        return chunks;
    }

    private int estimateTokenCount(String text) {
        return text.length() / 4;
    }

    public Pair<Integer,String> getContext(byte[] data, Integer userId) throws JsonProcessingException {
 
        List<PaperFile> files = getAllFilesByUserId(userId);
        float[] queryEmbedding = deserializeToFloatArray(data);
        String closestKey = "";
        Integer closesPaperFileId=0;
        double bestSimilarity = -1.0;
        
        for(PaperFile file : files){
            if(file.getEmbeddings() != null){
                Map<String, byte[]> embedding = file.getEmbeddings();
                for(Map.Entry<String, byte[]> entry : embedding.entrySet()){
                    float[] dbEmbedding = deserializeToFloatArray(entry.getValue());
                    double similarity = cosineSimilarity(queryEmbedding,dbEmbedding);
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

    @Override
    public String[] getContextRecommended(List<byte[]> data) throws JsonProcessingException {
        List<Paper> papers = paperService.findAll().stream().toList();
        List<float[]> queryEmbeddings = new ArrayList<>();
        for(byte[] d : data){
            queryEmbeddings.add(deserializeToFloatArray(d));
        }
        String[] closestKey = new String[]{"", "", ""};
        double[] bestSimilarity = new double[]{-1.0, -1.0, -1.0};
        for(Paper paper : papers){
            Integer counter =0;
            for(float[] f : queryEmbeddings){
                if(paper.getEmbeddings() != null){
                    Map<String, byte[]> embeddings = paper.getEmbeddings();
                    for(Map.Entry<String, byte[]> entry : embeddings.entrySet()){
                        float[] dbEmbedding = deserializeToFloatArray(entry.getValue());
                        double similarity = cosineSimilarity(f,dbEmbedding);
                        if(similarity > bestSimilarity[counter] && similarity < 1.0){
                            bestSimilarity[counter] = similarity;
                            closestKey[counter] = entry.getKey();
                        }        
                    }
                    counter++; 
                }
            }
        }
        return closestKey;
    }

    private List<PaperFile> getAllFilesByUserId(Integer userId) {
        return paperFileRepository.findByUserId(userId);
           
    }

    private float[] deserializeToFloatArray(byte[] data) throws JsonProcessingException {
        String jsonStringFromDb = new String(data, StandardCharsets.UTF_8);
        JsonNode restoredJsonNode;
        ObjectMapper objectMapper = new ObjectMapper();
            try {
                restoredJsonNode = objectMapper.readTree(jsonStringFromDb);

            float[] embedding = new float[restoredJsonNode.size()];
            for (int i = 0; i < restoredJsonNode.size(); i++) {
                JsonNode valueNode = restoredJsonNode.get(i);
                embedding[i] = valueNode.floatValue(); // Convertir a float
            }
            return embedding;
        } catch (JsonProcessingException e) {
            throw new JsonProcessingException("Error al procesar JSON") {};
        }
    }

    private double cosineSimilarity(float[] vec1, float[] vec2) {
        if (vec1.length != vec2.length) throw new IllegalArgumentException("Vector sizes must match");
        double dot = 0.0, norm1 = 0.0, norm2 = 0.0;
        for (int i = 0; i < vec1.length; i++) {
            dot += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }
        return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

}
