package org.springframework.samples.pubus.paper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.Mockito;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.samples.pubus.exceptions.ResourceNotFoundException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import jakarta.servlet.http.HttpServletRequest;

public class PaperFileServiceImplTest {
    @Mock
    private PaperFileRepository paperFileRepository;

    @Mock
    private PaperService paperService;

    @InjectMocks
    private PaperFileServiceImpl paperFileService;

    @Mock
    private ServletUriComponentsBuilder componentsBuilder;

    @Mock
    private HttpServletRequest mockRequest;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);

        when(mockRequest.getContextPath()).thenReturn("/api/v1");

        Paper paper = new Paper();
        paper.setId(1);
        paper.setTitle("Sample Paper");
        paper.setPaperFiles(new ArrayList<>());

        // MultipartFile file = new MockMultipartFile(
        //     "file", 
        //     "testfile.pdf", 
        //     "application/pdf", 
        //     "test content".getBytes()
        // );
    }

    // private ResponseFile responseFile;

    @Test
    public void testSave() {
        PaperFile paperFile = new PaperFile();
        when(paperFileRepository.save(paperFile)).thenReturn(paperFile);
        
        PaperFile result = paperFileService.save(paperFile);
        
        assertEquals(paperFile, result);
        verify(paperFileRepository, times(1)).save(paperFile);
    }

    @Test
    public void testDownload_FileFound() throws NotFoundException {
        Integer id = 1;
        PaperFile paperFile = new PaperFile();
        when(paperFileRepository.findById(id)).thenReturn(Optional.of(paperFile));

        Optional<PaperFile> result = paperFileService.download(id);

        assertTrue(result.isPresent());
        assertEquals(paperFile, result.get());
    }

    @Test
    public void testDownload_FileNotFound() {
        Integer id = 1;
        when(paperFileRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> {
            paperFileService.download(id);
        });
    }
    
    @Test
    public void testUploadSuccess() throws IOException {
      // Mock objects
      MockMultipartFile file = new MockMultipartFile("test_file.txt", "text/plain", "txt", "This is a test file".getBytes());
      Paper mockPaper = new Paper();
      mockPaper.setPaperFiles(new ArrayList<>());
      Integer paperId = 1;

      // Mock behavior
      PaperFile expectedPaperFile = new PaperFile();
          expectedPaperFile.setName("test_file.txt");
          expectedPaperFile.setType("text/plain");
          expectedPaperFile.setData("This is a test file".getBytes());
          expectedPaperFile.setPaper(mockPaper);

    Mockito.when(paperFileRepository.save(Mockito.any(PaperFile.class))).thenReturn(expectedPaperFile);
    
      // Call the upload method
      PaperFile uploadedFile = paperFileService.upload(file, mockPaper, paperId);
      
      // Assertions
      assertNotNull(uploadedFile);
      assertEquals(expectedPaperFile.getName(), uploadedFile.getName());
      assertEquals(expectedPaperFile.getType(), uploadedFile.getType());
      assertEquals(expectedPaperFile.getData(), uploadedFile.getData());
      assertEquals(mockPaper, uploadedFile.getPaper());

    }

    @Test
    public void testDeletePaperFile() {
        Integer id = 1;
        paperFileService.deletePaperFile(id);
        verify(paperFileRepository, times(1)).deleteById(id);
    }

    @Test
    public void testGetPaperFileById_FileFound() {
        Integer id = 1;
        PaperFile paperFile = new PaperFile();
        when(paperFileRepository.findById(id)).thenReturn(Optional.of(paperFile));

        PaperFile result = paperFileService.getPaperFileById(id);

        assertEquals(paperFile, result);
    }

    @Test
    public void testGetPaperFileById_FileNotFound() {
        Integer id = 1;
        when(paperFileRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            paperFileService.getPaperFileById(id);
        });
    }

}
