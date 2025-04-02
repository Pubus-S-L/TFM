package org.springframework.samples.pubus.paper;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import static org.junit.Assert.*;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessException;
import org.springframework.samples.pubus.exceptions.ResourceNotFoundException;
import org.springframework.samples.pubus.paper.exceptions.DuplicatedPaperTitleException;
import org.springframework.samples.pubus.user.User;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;


@SpringBootTest
@AutoConfigureTestDatabase
public class PaperServiceTest {
    
    @Mock
    private PaperRepository paperRepository;

    @InjectMocks
    private PaperService paperService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testFindPaperTypes() {
        // Arrange
        List<PaperType> paperTypes = new ArrayList<>();
        when(paperRepository.findPaperTypes()).thenReturn(paperTypes);

        // Act
        List<PaperType> result = paperService.findPaperTypes();

        // Assert
        assertEquals(paperTypes, result);
    }

    @Test
    void testFindAll() {
        // Arrange
        List<Paper> papers = new ArrayList<>();
        when(paperRepository.findAll()).thenReturn(papers);

        // Act
        Collection<Paper> result = paperService.findAll();

        // Assert
        assertEquals(papers, result);
    }

    @Test
    void testFindPaperById() {
        // Arrange
        int id = 1;
        Paper paper = new Paper();
        when(paperRepository.findById(id)).thenReturn(Optional.of(paper));

        // Act
        Paper result = paperService.findPaperById(id);

        // Assert
        assertEquals(paper, result);
    }

    @Test
    void testFindPaperById_NotFound() {
        // Arrange
        int id = 1;
        when(paperRepository.findById(id)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> paperService.findPaperById(id));
    }

    @Test
    void testFindPaperByTitle() {
        // Arrange
        String title = "Test Paper";
        Paper paper = new Paper();
        paper.setTitle(title);
        List<Paper> paperList = new ArrayList<>();
        paperList.add(paper);
        when(paperRepository.findByTitle(title)).thenReturn(paperList);

        // Act
        List<Paper> result = paperService.findPaperByTitle(title);

        // Assert
        assertEquals(paperList, result);
    }

        @Test
    void testFindAllPapersAbstractWord() {
        // Arrange
        String word = "abstract";
        List<Paper> papers = new ArrayList<>();
        papers.add(new Paper());
        when(paperRepository.findAllPapersByAbstractWord(word)).thenReturn(papers);

        // Act
        List<Paper> result = paperService.findAllPapersAbstractWord(word);

        // Assert
        assertEquals(papers, result);
    }

    // Test for findAllPapersByKeyword
    @Test
    void testFindAllPapersByKeyword() {
        // Arrange
        String keyword = "keyword";
        List<Paper> papers = new ArrayList<>();
        papers.add(new Paper());
        when(paperRepository.findAllPapersByKeyWord(keyword)).thenReturn(papers);

        // Act
        List<Paper> result = paperService.findAllPapersByKeyword(keyword);

        // Assert
        assertEquals(papers, result);
    }

    // Test for findAllPapersByType
    @Test
    void testFindAllPapersByType() {
        // Arrange
        String paperType = "type";
        List<Paper> papers = new ArrayList<>();
        papers.add(new Paper());
        when(paperRepository.findAllPapersByPaperType(paperType)).thenReturn(papers);

        // Act
        List<Paper> result = paperService.findAllPapersByType(paperType);

        // Assert
        assertEquals(papers, result);
    }

    // Test for findAllPapersByAuthor
    @Test
    void testFindAllPapersByAuthor() {
        // Arrange
        String author = "author";
        List<Paper> papers = new ArrayList<>();
        papers.add(new Paper());
        when(paperRepository.findAllPapersByAuthor(author)).thenReturn(papers);

        // Act
        List<Paper> result = paperService.findAllPapersByAuthor(author);

        // Assert
        assertEquals(papers, result);
    }

    // Test for findAllPapersByUserId
    @Test
    void testFindAllPapersByUserId() {
        // Arrange
        int id = 1;
        List<Paper> papers = new ArrayList<>();
        papers.add(new Paper());
        when(paperRepository.findAllPapersByUserId(id)).thenReturn(papers);

        // Act
        List<Paper> result = paperService.findAllPapersByUserId(id);

        // Assert
        assertEquals(papers, result);
    }

    // Test for deletePaper
    @Test
    void testDeletePaper() {
        // Arrange
        int id = 1;
        Paper paper = new Paper();
        when(paperRepository.findById(id)).thenReturn(Optional.of(paper));

        // Act
        assertDoesNotThrow(() -> paperService.deletePaper(id));

        // Assert
        verify(paperRepository, times(1)).delete(paper);
    }

     @Test
    void testSavePaper_Success() throws DataAccessException, DuplicatedPaperTitleException {
        // Arrange
        User user = new User();
        user.setId(1);

        Paper paper = new Paper();
        paper.setId(1);
        paper.setTitle("Test Paper");
        paper.setUser(user);

        when(paperRepository.findAllPapersByUserId(1)).thenReturn(Arrays.asList());

        // Act
        Paper savedPaper = paperService.savePaper(paper);

        // Assert
        verify(paperRepository, times(1)).save(paper);
        assertEquals(paper, savedPaper);
    }

    @Test
    void testSavePaper_DuplicatedTitle() {
        // Arrange
        User user = new User();
        user.setId(1);

        Paper existingPaper = new Paper();
        existingPaper.setId(2);
        existingPaper.setTitle("Test Paper");
        existingPaper.setUser(user);

        Paper newPaper = new Paper();
        newPaper.setId(1);
        newPaper.setTitle("Test Paper");
        newPaper.setUser(user);

        when(paperRepository.findAllPapersByUserId(1)).thenReturn(Arrays.asList(existingPaper));

        // Act & Assert
        assertThrows(DuplicatedPaperTitleException.class, () -> {
            paperService.savePaper(newPaper);
        });

        verify(paperRepository, never()).save(any(Paper.class));
    }

    @Test
    void testGetPaperWithTitleAndIdDifferent_Found() {
        // Arrange
        User user = new User();
        user.setId(1);

        Paper existingPaper = new Paper();
        existingPaper.setId(2);
        existingPaper.setTitle("Test Paper");
        existingPaper.setUser(user);

        Paper newPaper = new Paper();
        newPaper.setId(1);
        newPaper.setTitle("Test Paper");
        newPaper.setUser(user);

        when(paperRepository.findAllPapersByUserId(1)).thenReturn(Arrays.asList(existingPaper));

        // Act
        Paper result = paperService.getPaperWithTitleAndIdDifferent(newPaper);

        // Assert
        assertEquals(existingPaper, result);
    }

    @Test
    void testGetPaperWithTitleAndIdDifferent_NotFound() {
        // Arrange
        User user = new User();
        user.setId(1);

        Paper newPaper = new Paper();
        newPaper.setId(1);
        newPaper.setTitle("Test Paper");
        newPaper.setUser(user);

        when(paperRepository.findAllPapersByUserId(1)).thenReturn(Arrays.asList());

        // Act
        Paper result = paperService.getPaperWithTitleAndIdDifferent(newPaper);

        // Assert
        assertNull(result);
    }

    @Test
    void testUpdatePaper_Success() throws DataAccessException, DuplicatedPaperTitleException {
        // Arrange
        User user = new User();
        user.setId(1);

        Paper existingPaper = new Paper();
        existingPaper.setId(1);
        existingPaper.setTitle("Old Title");
        existingPaper.setUser(user);

        Paper updatedPaper = new Paper();
        updatedPaper.setId(1);
        updatedPaper.setTitle("Updated Title");
        updatedPaper.setUser(user);

        when(paperRepository.findById(1)).thenReturn(Optional.of(existingPaper));
        when(paperRepository.findAllPapersByUserId(1)).thenReturn(Arrays.asList());

        // Act
        Paper result = paperService.updatePaper(updatedPaper, 1);

        // Assert
        verify(paperRepository, times(1)).save(existingPaper);
        assertEquals("Updated Title", result.getTitle());
    }

    @Test
    void testUpdatePaper_NotFound() {
        // Arrange
        Paper updatedPaper = new Paper();
        updatedPaper.setId(1);
        updatedPaper.setTitle("Updated Title");

        when(paperRepository.findById(1)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            paperService.updatePaper(updatedPaper, 1);
        });

        verify(paperRepository, never()).save(any(Paper.class));
    }



}
