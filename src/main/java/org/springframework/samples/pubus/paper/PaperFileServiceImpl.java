package org.springframework.samples.pubus.paper;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException;
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
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;


@Service
public class PaperFileServiceImpl implements PaperFileService {

    @Value("${openai.api.key}") // Tu clave API de OpenAI
    private String openaiApiKey;

    @Autowired
    private PaperFileRepository paperFileRepository;
    
    @Autowired
    private PaperService paperService;

    @Transactional
    public PaperFile save(PaperFile paperFile) {
        return paperFileRepository.save(paperFile);
    }
    private static final int MAX_TOKENS = 7000;


    @Override
    public PaperFile upload(MultipartFile file, Paper paper, Integer paperId) throws IOException {

        //Embedding
        if(file.getContentType().equals("application/pdf")){
            String extractedText = extractTextFromPdf(file);
            int tokenCount = estimateTokenCount(extractedText);
            if (tokenCount > MAX_TOKENS){
                List<String> chunks = splitTextIntoChunks(extractedText);
                for (String chunk : chunks) {
                    addEmbedding(chunk, paper);
                }
            }else{
                addEmbedding(extractedText, paper);
            }
            
        }

        String fileName = StringUtils.cleanPath(file.getOriginalFilename());

       PaperFile paperFile = PaperFile.builder()
       .name(fileName)
       .type(file.getContentType())
       .data(file.getBytes())
       .paper(paper)
       .build();
       List<PaperFile> paperFiles = paper.getPaperFiles();
       paperFiles.add(paperFile);
       paper.setPaperFiles(paperFiles);
       paperService.updatePaper(paper, paperId);
       return paperFileRepository.save(paperFile);
    }

    private void addEmbedding(String text, Paper paper){
        try {
            byte[] embedding = getEmbeddingFromOpenAI(text);
            if(paper.getEmbedding()==null){
                paper.setEmbedding(embedding);
            }
            else{
                byte[] byte1 = paper.getEmbedding();
                byte[] combined = new byte[byte1.length + embedding.length];
                System.arraycopy(byte1, 0, combined, 0, byte1.length);
                System.arraycopy(embedding, 0, combined, byte1.length, embedding.length);
                paper.setEmbedding(combined);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
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
        private byte[] getEmbeddingFromOpenAI(String text) throws IOException {
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

        public byte[] convertEmbeddingToBinary(String responseBody) throws IOException {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode rootNode = objectMapper.readTree(responseBody);
            JsonNode embeddingNode = rootNode.path("data").get(0).path("embedding");
    
            if (embeddingNode.isArray()) {
                List<Double> embeddingList = objectMapper.convertValue(embeddingNode, new TypeReference<List<Double>>() {});
                ByteBuffer buffer = ByteBuffer.allocate(embeddingList.size() * Double.BYTES);
                embeddingList.forEach(buffer::putDouble);   
                return buffer.array(); 
            } else {
                throw new IOException("El campo 'embedding' no es un array válido.");
            }
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

}
