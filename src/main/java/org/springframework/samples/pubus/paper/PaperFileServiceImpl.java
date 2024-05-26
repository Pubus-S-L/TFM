package org.springframework.samples.pubus.paper;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException;
import org.springframework.samples.pubus.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;


@Service
public class PaperFileServiceImpl implements PaperFileService {

    @Autowired
    private PaperFileRepository paperFileRepository;
    
    @Autowired
    private PaperService paperService;

    @Transactional
    public PaperFile save(PaperFile paperFile) {
        return paperFileRepository.save(paperFile);
    }


    @Override
    public PaperFile upload(MultipartFile file, Paper paper, Integer paperId) throws IOException {
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


}
