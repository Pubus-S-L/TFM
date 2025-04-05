package org.springframework.samples.pubus.paper;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException;
import org.springframework.data.util.Pair;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;

public interface PaperFileService {
    PaperFile upload(MultipartFile file, Paper paper, Integer paperId) throws IOException;
    Optional<PaperFile> download(Integer id) throws NotFoundException;
    List<ResponseFile> getAllFilesByPaperId(Integer paperId);
    void deletePaperFile(Integer id);
    PaperFile getPaperFileById(Integer id);
    byte[] getEmbeddingFromOpenAI(String text) throws IOException;
    Pair<Integer,String> getContext(byte[] data, Integer userId) throws JsonProcessingException;
    Map<String, byte[]> addEmbedding(String text, Map<String, byte[]> embeddingMap);
    String[] getContextRecommended(List<byte[]> data) throws JsonProcessingException;
}
