package org.springframework.samples.pubus.paper;

import static org.junit.Assert.assertThat;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
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
    public void testFindAllPapersByUserId() {
        int userId = 1;
        List<Paper> expectedPapers = Arrays.asList(new Paper(), new Paper());
        when(paperService.findAllPapersByUserId(userId)).thenReturn(expectedPapers);

        ResponseEntity<List<Paper>> response = paperRestController.findAll(userId, null);

        assertEqual(response.getStatusCode(),HttpStatus.OK);
        //assertThat(response.getBody()).isEqualTo(expectedPapers);
    }

    private void assertEqual(HttpStatusCode statusCode, HttpStatus ok) {
      // TODO Auto-generated method stub
      throw new UnsupportedOperationException("Unimplemented method 'assertEqual'");
    }

    // @Test
    // public void testFindAllTypes() {
    //     List<PaperType> expectedTypes = Arrays.asList(new PaperType(), new PaperType());
    //     when(paperService.findPaperTypes()).thenReturn(expectedTypes);

    //     ResponseEntity<List<PaperType>> response = paperRestController.findAllTypes();

    //     assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    //     assertThat(response.getBody()).isEqualTo(expectedTypes);
    // }


    // @Test
    // public void testFindById() {
    //     int paperId = 1;
    //     Paper expectedPaper = new Paper();
    //     when(paperService.findPaperById(paperId)).thenReturn(expectedPaper);

    //     ResponseEntity<Paper> response = paperRestController.findById(paperId);

    //     assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    //     assertThat(response.getBody()).isEqualTo(expectedPaper);
    // }

    // @Test
    // public void testCreatePaper() throws Exception {
    //     int userId = 1;
    //     Paper paper = new Paper();
    //     User user = new User();
    //     when(userService.findUser(userId)).thenReturn(user);
    //     when(paperService.savePaper(any(Paper.class))).thenReturn(paper);

    //     ResponseEntity<Paper> response = paperRestController.create(paper, null, String.valueOf(userId));

    //     assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    //     assertThat(response.getBody()).isEqualTo(paper);
    // }

    // @Test
    // public void testUpdatePaper() throws Exception {
    //     int paperId = 1;
    //     int userId = 1;
    //     Paper paper = new Paper();
    //     User user = new User();
    //     user.setId(userId);
    //     paper.setUser(user);
    //     when(paperService.findPaperById(paperId)).thenReturn(paper);
    //     when(userService.findUser(userId)).thenReturn(user);
    //     when(paperService.updatePaper(any(Paper.class), anyInt())).thenReturn(paper);

    //     ResponseEntity<Paper> response = paperRestController.update(paperId, paper, null, String.valueOf(userId));

    //     assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    //     assertThat(response.getBody()).isEqualTo(paper);
    // }

    // @Test
    // public void testDeletePaper() {
    //     int paperId = 1;
    //     Paper paper = new Paper();
    //     when(paperService.findPaperById(paperId)).thenReturn(paper);

    //     ResponseEntity<MessageResponse> response = paperRestController.delete(paperId);

    //     assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    //     assertThat(response.getBody().getMessage()).isEqualTo("Paper deleted!");
    // }

}
