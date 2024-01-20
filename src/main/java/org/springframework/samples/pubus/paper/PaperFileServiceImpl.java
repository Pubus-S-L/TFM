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

    @Transactional
    public PaperFile save(PaperFile paperFile) {
        return paperFileRepository.save(paperFile);
    }

	@Transactional(readOnly = true)
    public PaperFile getPaperFileById(int paperFileId) {
        return paperFileRepository.findById(paperFileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found with ID: " + paperFileId));
    }

	// @Transactional(readOnly = true)
	// public List<PaperFile> findAllPaperFilesByPaperId(int paperId) throws DataAccessException {
	// 	return paperFileRepository.findByPaperId(paperId);
	// }

    // @Transactional(readOnly = true)
    // public PaperFile findByPaperFileIdAndPaperId(int paperId, int paperFileId) throws DataAccessException {
    //     List<PaperFile> paperFiles = findAllPaperFilesByPaperId(paperId);
    //     Optional<PaperFile> paperFile = paperFiles.stream().filter(f -> f.id == paperFileId).findFirst();
    //     if (paperFile.isPresent()) return paperFile.get();
    //     else throw new ResourceNotFoundException("File not found with ID: " + paperFileId);
    // }

    @Transactional
    public void deletePaperFile(int paperFileId) {
        paperFileRepository.deleteById(paperFileId);
    }

    @Override
    public PaperFile upload(MultipartFile file, Paper paper) throws IOException {
       String fileName = StringUtils.cleanPath(file.getOriginalFilename());
       
       PaperFile paperFile = PaperFile.builder()
       .name(fileName)
       .type(file.getContentType())
       .data(file.getBytes())
       .paper(paper)
       .build();
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


}
