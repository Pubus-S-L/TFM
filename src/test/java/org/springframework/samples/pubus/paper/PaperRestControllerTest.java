// package org.springframework.samples.pubus.paper;

// import static org.junit.jupiter.api.Assertions.assertArrayEquals;
// import static org.junit.jupiter.api.Assertions.assertEquals;
// import static org.junit.jupiter.api.Assertions.assertNotNull;
// import static org.junit.jupiter.api.Assertions.assertTrue;
// import static org.mockito.ArgumentMatchers.any;
// import static org.mockito.Mockito.verify;
// import static org.mockito.Mockito.when;
// import java.io.IOException;
// import java.util.ArrayList;
// import java.util.Arrays;
// import java.util.Collections;
// import java.util.List;
// import java.util.Optional;
// import org.junit.jupiter.api.Test;
// import org.junit.jupiter.api.extension.ExtendWith;
// import org.junit.jupiter.api.BeforeEach;
// import org.mockito.InjectMocks;
// import org.mockito.Mock;
// import org.mockito.Mockito;
// import org.mockito.MockitoAnnotations;
// import org.mockito.junit.jupiter.MockitoExtension;
// import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
// import org.springframework.boot.test.context.SpringBootTest;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.mock.web.MockMultipartFile;
// import org.springframework.samples.pubus.auth.payload.response.MessageResponse;
// import org.springframework.samples.pubus.user.User;
// import org.springframework.samples.pubus.user.UserService;
// import org.springframework.web.client.RestTemplate;
// import org.springframework.web.multipart.MultipartFile;

// import com.fasterxml.jackson.databind.ObjectMapper;

// @SpringBootTest
// @AutoConfigureTestDatabase
// @ExtendWith(MockitoExtension.class)
// public class PaperRestControllerTest {

//     @Mock
//     private PaperService paperService;

//     @Mock
//     private UserService userService;

//     @Mock
//     private PaperFileService paperFileService;

//     @Mock
//     private RestTemplate restTemplate;

//     @Mock
//     private ObjectMapper objectMapper;

//     @InjectMocks
//     private PaperRestController paperRestController;

//     @BeforeEach
//     void setUp() {
//         MockitoAnnotations.openMocks(this);
//     }

//     @Test
//     public void testFindAllPapers() {
//     // Mock the paperService to return a list of papers
//     List<Paper> expectedPapers = new ArrayList<>();
//     Paper paper1 = new Paper();
//     paper1.setTitle("Test paper 1");
//     expectedPapers.add(paper1);
//     Paper paper2 = new Paper();
//     paper2.setTitle("Test paper 2");
//     expectedPapers.add(paper2);
//     Mockito.when(paperService.findAll()).thenReturn(expectedPapers);
//     paperRestController = new PaperRestController(paperService, userService, paperFileService, restTemplate, objectMapper);
//     // Call the controller method
//     ResponseEntity<List<Paper>> response = paperRestController.findAll(null, null);

//     // Assert that the response is successful and contains the expected papers
//     assertEquals(HttpStatus.OK, response.getStatusCode());
// }

//     @Test
//     public void testFindAllPapersByType() {
//         // Mock the paperService to return a list of papers for a specific type
//         String paperTypeName = "Article";
//         PaperType paperType = new PaperType();
//         paperType.setId(1);
//         paperType.setName(paperTypeName);
//         List<Paper> expectedPapers = new ArrayList<>();
//         Paper paper1 = new Paper();
//         paper1.setType(paperType);
//         expectedPapers.add(paper1);
//         Mockito.when(paperService.findAllPapersByType(paperTypeName)).thenReturn(expectedPapers);
//         paperRestController = new PaperRestController(paperService, userService, paperFileService, restTemplate, objectMapper);
//         // Call the controller method
//         ResponseEntity<List<Paper>> response = paperRestController.findAllPapersByType(paperTypeName);

//         // Assert that the response is successful and contains the expected papers
//         assertEquals(HttpStatus.OK, response.getStatusCode());
//     }

//     @Test
//     public void testFindAllTypes() throws Exception {
//     // Mock the PaperService to return a list of paper types
//     List<PaperType> paperTypes = new ArrayList<>();
//     PaperType paperType1 = new PaperType();
//     paperType1.setId(1);
//     paperType1.setName("Article");
//     paperTypes.add(paperType1);
//     PaperType paperType2 = new PaperType();
//     paperType2.setId(2);
//     paperType2.setName("Book");
//     paperTypes.add(paperType2);
//     Mockito.when(paperService.findPaperTypes()).thenReturn(paperTypes);
//     paperRestController = new PaperRestController(paperService, userService, paperFileService, restTemplate, objectMapper);
//     // Call the controller method
//     ResponseEntity<List<PaperType>> responseEntity = paperRestController.findAllTypes();

//     // Assert that the response is successful (status code 200)
//     assertEquals(HttpStatus.OK, responseEntity.getStatusCode());

//     // Assert that the response body contains the list of paper types
//     List<PaperType> responsePaperTypes = responseEntity.getBody();
//     assertEquals(2, responsePaperTypes.size());
//     assertEquals("Article", responsePaperTypes.get(0).getName());
//     assertEquals("Book", responsePaperTypes.get(1).getName());
//     }

//     @Test
//     void testSearchPaper() {
//         // Mock data
//         String search = "test";
//         Paper paper1 = new Paper();
//         paper1.setId(1);
//         paper1.setAuthors("Test Authors");
//         paper1.setAbstractContent(" Abstract");
//         Paper paper2 = new Paper();
//         paper2.setId(1);
//         paper2.setAuthors("Authors");
//         paper2.setAbstractContent(" Test Abstract");
//         paper2.setKeywords("test");

        
//         List<Paper> list1 = Collections.singletonList(paper1);
//         List<Paper> list2 = Collections.singletonList(paper2);


//         // Mock behavior
//         when(paperService.findAllPapersByAuthor(search)).thenReturn(list1);
//         when(paperService.findAllPapersAbstractWord(search)).thenReturn(list2);
//         when(paperService.findAllPapersByKeyword(search)).thenReturn(list2);
//         paperRestController = new PaperRestController(paperService, userService, paperFileService, restTemplate, objectMapper);
//         // Call the method to test
//         ResponseEntity<List<Paper>> response = paperRestController.searchPaper(search);

//         // Verify the results
//         assertEquals(HttpStatus.OK, response.getStatusCode());
//         assertNotNull(response.getBody());
//         assertEquals(2, response.getBody().size());
//         assertTrue(response.getBody().contains(paper1));
//         assertTrue(response.getBody().contains(paper2));
// }
  


//     @Test
//     public void testFindAllPapersByUserId() {
//         int userId = 1;
//         List<Paper> expectedPapers = Arrays.asList(new Paper(), new Paper());
//         when(paperService.findAllPapersByUserId(userId)).thenReturn(expectedPapers);
//         paperRestController = new PaperRestController(paperService, userService, paperFileService, restTemplate, objectMapper);
//         ResponseEntity<List<Paper>> response = paperRestController.findAll(userId, null);

//         assertEquals(response.getStatusCode(),HttpStatus.OK);
//         assertEquals(response.getBody(),expectedPapers);
//     }

//     @Test
//     public void testUploadFile_SuccessSingleFile() throws IOException {
//     Integer paperId = 1;
//     Paper paper = new Paper();
//     paper.setId(paperId);
//     byte[] byteArray = new byte[] { 10, 20, 30, 40, 50 };
//     MultipartFile mockFile = new MockMultipartFile("test.pdf",byteArray);
//     List<MultipartFile> files = Collections.singletonList(mockFile);
//     PaperFile paperFile = PaperFile.builder()
//        .name("test.pdf")
//        .data(byteArray)
//        .paper(paper)
//        .build();
//     when(paperService.findPaperById(paperId)).thenReturn(paper);
    
//     when(paperFileService.upload(mockFile, paper, paperId)).thenReturn(paperFile);
//     paperRestController = new PaperRestController(paperService, userService, paperFileService, restTemplate, objectMapper);

//     ResponseEntity<Paper> response = paperRestController.uploadFile(paperId, paper, files);

//     assertEquals(HttpStatus.OK, response.getStatusCode());
//     verify(paperService).findPaperById(paperId);
//     verify(paperFileService).upload(mockFile, paper, paperId);
// }

//     @Test
//     public void testDownloadFile_Success() throws Exception {
//         int paperFileId = 1;
//         PaperFile paperFile = new PaperFile();
//         paperFile.setId(paperFileId);
//         paperFile.setType("application/pdf");
//         paperFile.setName("test.pdf");
//         paperFile.setData("some data".getBytes());

//         Optional<PaperFile> opPaperFile = Optional.of(paperFile);

//         when(paperFileService.download(paperFileId)).thenReturn(opPaperFile);
//         paperRestController = new PaperRestController(paperService, userService, paperFileService, restTemplate, objectMapper);
//         ResponseEntity<byte[]> response = paperRestController.downloadFile(paperFileId);

//         assertEquals(HttpStatus.OK, response.getStatusCode());
//         assertEquals("application/pdf", response.getHeaders().getContentType().toString());
//         assertEquals("attachment; filename=\"test.pdf\"", 
//                     response.getHeaders().getContentDisposition().toString());
//         assertArrayEquals(paperFile.getData(), response.getBody());

//         verify(paperFileService).download(paperFileId);
//     }

//     @Test
//     public void testGetListFiles_Success() {
//         int paperId = 1;
//         Paper paper = new Paper();
//         paper.setId(paperId);
//         List<ResponseFile> files = new ArrayList<>();

//         when(paperService.findPaperById(paperId)).thenReturn(paper);
//         when(paperFileService.getAllFilesByPaperId(paperId)).thenReturn(files);
//         paperRestController = new PaperRestController(paperService, userService, paperFileService, restTemplate, objectMapper);
//         ResponseEntity<List<ResponseFile>> response = paperRestController.getListFiles(paperId);

//         assertEquals(HttpStatus.OK, response.getStatusCode());
//         verify(paperService).findPaperById(paperId);
//         verify(paperFileService).getAllFilesByPaperId(paperId);
//     }

//     @Test
//     public void testFindById_Success() {
//         int paperId = 1;
//         Paper paper = new Paper();
//         paper.setId(paperId);

//         when(paperService.findPaperById(paperId)).thenReturn(paper);
//         paperRestController = new PaperRestController(paperService, userService, paperFileService, restTemplate, objectMapper);
//         ResponseEntity<Paper> response = paperRestController.findById(paperId);

//         assertEquals(HttpStatus.OK, response.getStatusCode());
//         assertEquals(paper, response.getBody());
//         verify(paperService).findPaperById(paperId);
//     }

//     // @Test
//     // public void testFindAllByUserId_Success() {
//     //     int userId = 1;
//     //     List<Paper> papers = new ArrayList<>();

//     //     when(paperService.findAllPapersByUserId(userId)).thenReturn(papers);
//     //     paperRestController = new PaperRestController(paperService, userService, paperFileService, restTemplate, objectMapper);
        
//     //     ResponseEntity<List<Paper>> response = paperRestController.findAllByUserId(userId);

//     //     assertEquals(HttpStatus.OK, response.getStatusCode());
//     // }

//     @Test
//     public void testCreate_Success() throws Exception {
//         // Mock data
//         int userId = 1;
//         String title = "Test Title";
//         String content = "This is some test content for the paper.";
//         Paper paper = new Paper();
//         paper.setId(1);
//         paper.setTitle(title);
//         paper.setAbstractContent(content);
//         User user = new User();
//         user.setId(userId);


//         // Mock behavior
//         when(userService.findUser(userId)).thenReturn(user);
//         when(paperService.savePaper(any(Paper.class))).thenReturn(paper);
//         when(paperService.updatePaper(any(Paper.class),(any(Integer.class)))).thenReturn(paper);

//         // Call the method
//         paperRestController = new PaperRestController(paperService, userService, paperFileService, restTemplate, objectMapper);
//         ResponseEntity<Paper> response = paperRestController.create(paper, null, String.valueOf(userId));

//         // Assertions
//         assertEquals(HttpStatus.OK, response.getStatusCode());
//         Paper returnedPaper = response.getBody();
//         assertNotNull(returnedPaper);
//         assertEquals(title, returnedPaper.getTitle());
//         assertEquals(content, returnedPaper.getAbstractContent());

//     }

//         @Test
//     public void testUpdate_SuccessWithUpload() throws Exception {
//         // Mock data
//         int paperId = 1;
//         String title = "Updated Paper Title";
//         String content = "Updated paper content.";
//         Paper paper = new Paper();
//         paper.setId(paperId);
//         paper.setTitle(title);
//         paper.setAbstractContent(content);
//         User user = new User();
//         user.setId(1); 

//         // Mock behavior
//         Paper existingPaper = new Paper(); 
//         existingPaper.setId(paperId);
//         existingPaper.setUser(user);
//         when(paperService.findPaperById(paperId)).thenReturn(existingPaper);
//         when(userService.findUser(user.getId())).thenReturn(user);
//         when(paperService.updatePaper(paper, paperId)).thenReturn(paper); 

//         // Call the method
//         paperRestController = new PaperRestController(paperService, userService, paperFileService, restTemplate, objectMapper);
//         ResponseEntity<Paper> response = paperRestController.update(paperId, paper, null, String.valueOf(user.getId()));

//         // Assertions
//         assertEquals(HttpStatus.OK, response.getStatusCode());
//         Paper returnedPaper = response.getBody();
//         assertNotNull(returnedPaper);
//         assertEquals(title, returnedPaper.getTitle());
//         assertEquals(content, returnedPaper.getAbstractContent());

//         // Verify interactions with mocked services
//         verify(paperService).findPaperById(paperId);
//         verify(userService).findUser(user.getId());
//         verify(paperService).updatePaper(paper, paperId);

//     }

//     @Test
//     public void testDelete_Success() throws Exception {
//         // Mock data
//         int paperId = 1;

//         // Mock behavior
//         Paper existingPaper = new Paper();
//         existingPaper.setId(paperId);
//         when(paperService.findPaperById(paperId)).thenReturn(existingPaper);

//         // Call the method
//         paperRestController = new PaperRestController(paperService, userService, paperFileService, restTemplate, objectMapper);
//         ResponseEntity<MessageResponse> response = paperRestController.delete(paperId);

//         // Assertions
//         assertEquals(HttpStatus.OK, response.getStatusCode());
//         assertEquals("Paper deleted!", response.getBody().getMessage());

//         // Verify interactions with mocked services
//         verify(paperService).findPaperById(paperId);
//         verify(paperService).deletePaper(paperId);
//     }

//     @Test
//     public void testDeletePaperFile_Success() throws Exception {
//         // Mock data
//         int paperFileId = 1;

//         // Mock behavior
//         PaperFile paperFile = new PaperFile();
//         paperFile.setId(paperFileId);
//         when(paperFileService.getPaperFileById(paperFileId)).thenReturn(paperFile);

//         // Call the method
//         paperRestController = new PaperRestController(paperService, userService, paperFileService, restTemplate, objectMapper);
//         ResponseEntity<MessageResponse> response = paperRestController.deletePaperFile(paperFileId);

//         // Assertions
//         assertEquals(HttpStatus.OK, response.getStatusCode());
//         assertEquals("File deleted!", response.getBody().getMessage());

//         // Verify interactions with mocked services
//         verify(paperFileService).getPaperFileById(paperFileId);
//         verify(paperFileService).deletePaperFile(paperFileId);
//     }

//     // @Test
//     // public void testImportPapersByExcell_Success() throws Exception {
//     //     // Mock data
//     //     Integer userId = 1;
//     //     List<List<String>> mockData = new ArrayList<>();
//     //     mockData.add(Collections.singletonList("Header")); 
//     //     List<String> paperData1 = Arrays.asList(null,"Title 1", "2023", "conferencia", "DOI 1", "Data 1", "Publisher 1", "Source 1", "NA", "Authors 1");
//     //     List<String> paperData2 = Arrays.asList(null,"Title 2", "2022", "Article", null, "Data 2", "Publisher 2", "Source 2", "Scopus 2", "Authors 2");
//     //     List<String> paperData3 = Arrays.asList(null,"Title 3", "2022", "artículo", null, "Data 2", "Publisher 2", "Source 2", "Scopus 2", "Authors 2");
//     //     List<String> paperData4 = Arrays.asList(null,"Title 4", "2022", "libro", null, "Data 2", "Publisher 2", "Source 2", "Scopus 2", "Authors 2");
//     //     List<String> paperData5 = Arrays.asList(null,"Title 5", "2022", "tesis", null, "Data 2", "Publisher 2", "Source 2", "Scopus 2", "Authors 2");
//     //     List<String> paperData6 = Arrays.asList(null,"Title 6", "2022", "reporte técnico", null, "Data 2", "Publisher 2", "Source 2", "Scopus 2", "Authors 2");
//     //     List<String> paperData7 = Arrays.asList(null,"Title 7", "2022", "disertación", null, "Data 2", "Publisher 2", "Source 2", "Scopus 2", "Authors 2");
//     //     List<String> paperData8 = Arrays.asList(null,"Title 8", "2022", "ensayo", null, "Data 2", "Publisher 2", "Source 2", "Scopus 2", "Authors 2");
//     //     List<String> paperData9 = Arrays.asList(null,"Title 9", "2022", "documento", null, "Data 2", "Publisher 2", "Source 2", "Scopus 2", "Authors 2");
//     //     List<String> paperData10 = Arrays.asList(null,"Title 10", "2022", "capítulo", null, "Data 2", "Publisher 2", "Source 2", "Scopus 2", "Authors 2");
//     //     List<String> paperData11 = Arrays.asList(null,"Title 11", "2022", "cuaderno", null, "Data 2", "Publisher 2", "Source 2", "Scopus 2", "Authors 2");
//     //     List<String> paperData12 = Arrays.asList(null,"Title 12", "2022", "ponencia", null, "Data 2", "Publisher 2", "Source 2", "Scopus 2", "Authors 2");

//     //     mockData.add(paperData1);
//     //     mockData.add(paperData2);
//     //     mockData.add(paperData3);
//     //     mockData.add(paperData4);
//     //     mockData.add(paperData5);
//     //     mockData.add(paperData6);
//     //     mockData.add(paperData7);
//     //     mockData.add(paperData8);
//     //     mockData.add(paperData9);
//     //     mockData.add(paperData10);
//     //     mockData.add(paperData11);
//     //     mockData.add(paperData12);

//     //     List<Paper> existingPapers = new ArrayList<>(); 
//     //     when(paperService.findAllPapersByUserId(userId)).thenReturn(existingPapers);

//     //     PaperType type1 = new PaperType(); 
//     //     type1.setName("Conference");
//     //     PaperType type2 = new PaperType(); 
//     //     type2.setName("Other");
//     //     PaperType type3 = new PaperType(); 
//     //     type3.setName("Article");
//     //     PaperType type4 = new PaperType(); 
//     //     type4.setName("Book");
//     //     PaperType type5 = new PaperType(); 
//     //     type5.setName("Thesis");
//     //     PaperType type6 = new PaperType(); 
//     //     type6.setName("Technical-report");
//     //     PaperType type7 = new PaperType(); 
//     //     type7.setName("Dissertation");
//     //     PaperType type8 = new PaperType(); 
//     //     type8.setName("Essay");
//     //     PaperType type9 = new PaperType(); 
//     //     type9.setName("Paper");
//     //     PaperType type10 = new PaperType(); 
//     //     type10.setName("Book-chapter");
//     //     PaperType type11 = new PaperType(); 
//     //     type11.setName("Booklet");


//     //     List<PaperType> paperTypes = Arrays.asList(type1,type2,type3,type4,type5,type6,type7,type8,type9,type10,type11);
//     //     when(paperService.findPaperTypes()).thenReturn(paperTypes);

//     //     // Mock behavior 
//     //     Paper savedPaper1 = new Paper(); 
//     //     savedPaper1.setTitle(paperData1.get(0));
//     //     when(paperService.savePaper(any(Paper.class))).thenReturn(savedPaper1);

//     //     // Call the method
//     //     paperRestController = new PaperRestController(paperService, userService, paperFileService, restTemplate, objectMapper);
//     //     ResponseEntity<MessageResponse> response = paperRestController.importPapersByExcell(userId, mockData);

//     //     // Assertions
//     //     assertEquals(HttpStatus.OK, response.getStatusCode());
//     //     assertEquals("Papers added correctly", response.getBody().getMessage());

//     //     // Verify interactions with mocked services
//     //     verify(paperService).findAllPapersByUserId(userId);
//     // }

//     @Test
//     public void testImportPapersByDOI_FailCase() throws Exception {
//         // Mock data
//         Integer userId = 1;
//         String searchTerm = "doi:10.1007/978-3-031-26507-5_30";

//         // Call the method
//         ResponseEntity<MessageResponse> response = paperRestController.importPapersByDOI(userId, searchTerm);

//         // Assertions
//         assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
//         assertEquals("Paper can not be added", response.getBody().getMessage());
//     }

// }
