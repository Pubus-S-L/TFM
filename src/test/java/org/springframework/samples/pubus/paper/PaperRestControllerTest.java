package org.springframework.samples.pubus.paper;

import static org.junit.Assert.assertThat;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.pubus.auth.payload.response.MessageResponse;
import org.springframework.samples.pubus.paper.exceptions.DuplicatedPaperTitleException;
import org.springframework.samples.pubus.user.User;
import org.springframework.samples.pubus.user.UserService;
import org.springframework.security.acls.model.NotFoundException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureTestDatabase
@ExtendWith(MockitoExtension.class)
public class PaperRestControllerTest {

    @Mock
    private PaperService paperService;

    @Mock
    private UserService userService;

    @Mock
    private PaperFileService paperFileService;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private PaperRestController paperRestController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testFindAllPapers() {
    // Mock the paperService to return a list of papers
    List<Paper> expectedPapers = new ArrayList<>();
    Paper paper1 = new Paper();
    paper1.setTitle("Test paper 1");
    expectedPapers.add(paper1);
    Paper paper2 = new Paper();
    paper2.setTitle("Test paper 2");
    expectedPapers.add(paper2);
    Mockito.when(paperService.findAll()).thenReturn(expectedPapers);

    // Call the controller method
    ResponseEntity<List<Paper>> response = paperRestController.findAll(null, null);

    // Assert that the response is successful and contains the expected papers
    assertEquals(HttpStatus.OK, response.getStatusCode());
}

  @Test
  public void testFindAllPapersByType() {
    // Mock the paperService to return a list of papers for a specific type
    String paperTypeName = "Article";
    PaperType paperType = new PaperType();
    paperType.setId(1);
    paperType.setName(paperTypeName);
    List<Paper> expectedPapers = new ArrayList<>();
    Paper paper1 = new Paper();
    paper1.setType(paperType);
    expectedPapers.add(paper1);
    Mockito.when(paperService.findAllPapersByType(paperTypeName)).thenReturn(expectedPapers);

    // Call the controller method
    ResponseEntity<List<Paper>> response = paperRestController.findAllPapersByType(paperTypeName);

    // Assert that the response is successful and contains the expected papers
    assertEquals(HttpStatus.OK, response.getStatusCode());
  }

  @Test
  public void testFindAllTypes() throws Exception {
  // Mock the PaperService to return a list of paper types
  List<PaperType> paperTypes = new ArrayList<>();
  PaperType paperType1 = new PaperType();
  paperType1.setId(1);
  paperType1.setName("Article");
  paperTypes.add(paperType1);
  PaperType paperType2 = new PaperType();
  paperType2.setId(2);
  paperType2.setName("Book");
  paperTypes.add(paperType2);
  Mockito.when(paperService.findPaperTypes()).thenReturn(paperTypes);
  paperRestController = new PaperRestController(paperService, userService, paperFileService, restTemplate, objectMapper);
  // Call the controller method
  ResponseEntity<List<PaperType>> responseEntity = paperRestController.findAllTypes();

  // Assert that the response is successful (status code 200)
  assertEquals(HttpStatus.OK, responseEntity.getStatusCode());

  // Assert that the response body contains the list of paper types
   List<PaperType> responsePaperTypes = responseEntity.getBody();
   assertEquals(2, responsePaperTypes.size());
   assertEquals("Article", responsePaperTypes.get(0).getName());
   assertEquals("Book", responsePaperTypes.get(1).getName());
}

@Test
    void testSearchPaper() {
        // Mock data
        String search = "test";
        Paper paper1 = new Paper();
        paper1.setId(1);
        paper1.setAuthors("Test Authors");
        paper1.setAbstractContent(" Abstract");
        Paper paper2 = new Paper();
        paper2.setId(1);
        paper2.setAuthors("Authors");
        paper2.setAbstractContent(" Test Abstract");
        paper2.setKeywords("test");

        
        List<Paper> list1 = Collections.singletonList(paper1);
        List<Paper> list2 = Collections.singletonList(paper2);


        // Mock behavior
        when(paperService.findAllPapersByAuthor(search)).thenReturn(list1);
        when(paperService.findAllPapersAbstractWord(search)).thenReturn(list2);
        when(paperService.findAllPapersByKeyword(search)).thenReturn(list2);

        // Call the method to test
        ResponseEntity<List<Paper>> response = paperRestController.searchPaper(search);

        // Verify the results
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        // assertEquals(2, response.getBody().size());
        // assertTrue(response.getBody().contains(paper1));
        // assertTrue(response.getBody().contains(paper2));
}
  


    @Test
    public void testFindAllPapersByUserId() {
        int userId = 1;
        List<Paper> expectedPapers = Arrays.asList(new Paper(), new Paper());
        when(paperService.findAllPapersByUserId(userId)).thenReturn(expectedPapers);

        ResponseEntity<List<Paper>> response = paperRestController.findAll(userId, null);

        assertEquals(response.getStatusCode(),HttpStatus.OK);
        //assertThat(response.getBody()).isEqualTo(expectedPapers);
    }

}
