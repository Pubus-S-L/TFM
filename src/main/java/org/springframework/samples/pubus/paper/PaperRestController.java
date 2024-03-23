package org.springframework.samples.pubus.paper;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collector;
import java.util.stream.Collectors;
import java.util.Optional;

import jakarta.annotation.Resource;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.dao.DataAccessException;
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.pubus.auth.payload.response.MessageResponse;
import org.springframework.samples.pubus.exceptions.AccessDeniedException;
import org.springframework.samples.pubus.exceptions.ResourceNotOwnedException;
import org.springframework.samples.pubus.paper.exceptions.DuplicatedPaperTitleException;
import org.springframework.samples.pubus.user.User;
import org.springframework.samples.pubus.user.UserService;
import org.springframework.samples.pubus.util.RestPreconditions;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.MatrixVariable;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.JsonNode;

import io.swagger.v3.core.util.Json;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/v1/papers")
@Tag(name = "Papers", description = "The Paper management API")
@SecurityRequirement(name = "bearerAuth")
public class PaperRestController {

	private final PaperService paperService;
	private final UserService userService;
	private final PaperFileService paperFileService;
	private static final String USER_AUTH = "USER";
	private static final String ADMIN_AUTH = "ADMIN";
	private final RestTemplate restTemplate;
	private final ObjectMapper objectMapper;

	@Autowired
	public PaperRestController(PaperService paperService, UserService userService, PaperFileService paperFileService, RestTemplate restTemplate,ObjectMapper objectMapper) {
		this.paperService = paperService;
		this.userService = userService;
		this.paperFileService = paperFileService;
		this.restTemplate = restTemplate;
		this.objectMapper = objectMapper;
	}

	@InitBinder("paper")
	public void initPaperBinder(WebDataBinder dataBinder) {
		dataBinder.setValidator(new PaperValidator());
	}

//GET TYPES	

	@GetMapping("types")
	public ResponseEntity<List<PaperType>> findAllTypes() {
		List<PaperType> res = (List<PaperType>) paperService.findPaperTypes();
		return new ResponseEntity<>(res, HttpStatus.OK);
	}

//GET PAPERS BY TYPE

	@GetMapping("/types/{paperType}")
	public ResponseEntity<List<Paper>> findAllPapersByType(@PathVariable String paperType) {
		return new ResponseEntity<>((List<Paper>) this.paperService.findAllPapersByType(paperType), HttpStatus.OK);
	}

	@GetMapping
	public ResponseEntity<List<Paper>> findAll(@RequestParam(required = false) Integer userId,@RequestParam(required = false) String search) {
		//User user = userService.findCurrentUser();
		if (userId != null) {
			//if (user.getId().equals(userId))
				return new ResponseEntity<>(paperService.findAllPapersByUserId(userId), HttpStatus.OK);
		} else {			
			if (search != null && !search.isEmpty()) {
				ResponseEntity<List<Paper>> res = searchPaper(search);
				return res;
			}
			else{
				return new ResponseEntity<>((List<Paper>) this.paperService.findAll(), HttpStatus.OK);
			}

				
		}
		//throw new AccessDeniedException();
	}

// GET FILTERED

	private ResponseEntity<List<Paper>> searchPaper(String originalSearch) {
		String search = originalSearch.toLowerCase();
		Set<Paper> set_complete = new HashSet<>();
		List<Paper> list1 = this.paperService.findAllPapersByAuthor(search);
		List<Paper> list2 = this.paperService.findAllPapersAbstractWord(search);
		List<Paper> list3 = this.paperService.findAllPapersByKeyword(search);

		set_complete.addAll(list1);
		set_complete.addAll(list2);
		set_complete.addAll(list3);

		List<Paper> list_complete = set_complete.stream().collect(Collectors.toList());

		return new ResponseEntity<>((List<Paper>) list_complete, HttpStatus.OK);
	}

//UPLOAD FILE

	private ResponseEntity<Paper> uploadFile(Integer paperId, Paper paper, List<MultipartFile> files) {
	try {
		//Paper paper = RestPreconditions.checkNotNull(paperService.findPaperById(paperId), "Paper", "ID", paperId);
		for(MultipartFile file: files){	
			long fileSize = file.getSize();
			long maxfileSize = 199 * 1024 * 1024;
			if (fileSize > maxfileSize) return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
			paperFileService.upload(file, paper, paperId);	
		}
		Paper paperUpdated = paperService.findPaperById(paperId);
		return ResponseEntity.status(HttpStatus.OK).body(paperUpdated);
	} catch (IOException e) {
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
	}
	}

//DOWNLOAD FILE

	@GetMapping("/{paperId}/download/{paperFileId}")
	public ResponseEntity<byte[]> downloadFile(@PathVariable int paperFileId) {
	try {
		PaperFile paperFile = paperFileService.download(paperFileId).get();
		return ResponseEntity.status(HttpStatus.OK)
				.header(HttpHeaders.CONTENT_TYPE, paperFile.getType())
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + paperFile.getName()+ "\"")
				.body(paperFile.getData());
				
	} catch (NotFoundException e) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
	}
	}

//GET FILES BY PAPERID

	@GetMapping("/{paperId}/files")
	public ResponseEntity<List<ResponseFile>> getListFiles(@PathVariable int paperId){
		Paper paper = RestPreconditions.checkNotNull(paperService.findPaperById(paperId), "Paper", "ID", paperId);
		List<ResponseFile> files = paperFileService.getAllFilesByPaperId(paperId);
		return ResponseEntity.status(HttpStatus.OK).body(files);
	}

//GET BY ID

	@GetMapping("{paperId}")
	public ResponseEntity<Paper> findById(@PathVariable("paperId") int paperId) {
		Paper paper = RestPreconditions.checkNotNull(paperService.findPaperById(paperId), "Paper", "ID", paperId);
			return new ResponseEntity<>(paper, HttpStatus.OK);
	} 
	
//GET BY USERID

	@GetMapping("/users/{userId}")
	public ResponseEntity<List<Paper>> findAllByUserId(@PathVariable("userId") int userId) {
		List<Paper> papers = RestPreconditions.checkNotNull(paperService.findAllPapersByUserId(userId), "User", "ID", userId);
			return new ResponseEntity<>(papers, HttpStatus.OK);
	}


//CREATE	

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ResponseEntity<Paper> create(@RequestPart @Valid Paper paper, @RequestParam(required=false) List<MultipartFile> files, @RequestPart("userId") String userId)
			throws DataAccessException, DuplicatedPaperTitleException {
		Integer id = Integer.parseInt(userId);
		User user = userService.findUser(id);
		Paper newPaper = new Paper();
		Paper savedPaper;
		BeanUtils.copyProperties(paper, newPaper, "id");
		newPaper.setUser(user);
		savedPaper = this.paperService.savePaper(newPaper);

		if(files!=null){
			ResponseEntity<Paper> res = uploadFile(savedPaper.getId(), savedPaper, files);
			return res;
		}
		else{
			Paper res = paperService.updatePaper(savedPaper, savedPaper.getId());
			return new ResponseEntity<>(res, HttpStatus.OK);
		}


		// return new ResponseEntity<>(savedPaper, HttpStatus.CREATED);
	}

//UPDATE

	@PutMapping("{paperId}")
	@ResponseStatus(HttpStatus.OK)
	public ResponseEntity<Paper> update(@PathVariable("paperId") int paperId, @RequestPart("paper") @Valid Paper paper, @RequestParam(required=false) List<MultipartFile> files, @RequestPart("userId") String userId) {
		Paper aux = RestPreconditions.checkNotNull(paperService.findPaperById(paperId), "Paper", "ID", paperId);
		Integer id = Integer.parseInt(userId);
		User loggedUser = userService.findUser(id);
			User paperUser = aux.getUser();
			if (loggedUser.getId().equals(paperUser.getId())) {
				if(files!=null){
					ResponseEntity<Paper> res = uploadFile(paperId, paper, files);
					return res;
				}
				else{
					Paper res = paperService.updatePaper(paper, paperId);
					return new ResponseEntity<>(res, HttpStatus.OK);
				}


			} else
				throw new ResourceNotOwnedException(aux);

	}

//DELETE	

	@DeleteMapping("{paperId}")
	@ResponseStatus(HttpStatus.OK)
	public ResponseEntity<MessageResponse> delete(@PathVariable("paperId") int paperId) {
		Paper paper = RestPreconditions.checkNotNull(paperService.findPaperById(paperId), "Paper", "ID", paperId);
		// User loggedUser = userService.findCurrentUser();
		// 	User paperUser = paper.getUser();
		// 	if (loggedUser.getId().equals(paperUser.getId())) {
				paperService.deletePaper(paperId);
				return new ResponseEntity<>(new MessageResponse("Paper deleted!"), HttpStatus.OK);
			// } else
			// 	throw new ResourceNotOwnedException(paper);
	}

//DELETE PAPERFILE

	@DeleteMapping("{paperId}/delete/{paperFileId}")
	@ResponseStatus(HttpStatus.OK)
	public ResponseEntity<MessageResponse> deletePaperFile(@PathVariable("paperFileId") int paperFileId) {
		PaperFile paperFile = RestPreconditions.checkNotNull(paperFileService.getPaperFileById(paperFileId), "PaperField", "ID", paperFileId);
		// User loggedUser = userService.findCurrentUser();
		// 	User paperUser = paper.getUser();
		// 	if (loggedUser.getId().equals(paperUser.getId())) {
				paperFileService.deletePaperFile(paperFileId);
				return new ResponseEntity<>(new MessageResponse("File deleted!"), HttpStatus.OK);
			// } else
			// 	throw new ResourceNotOwnedException(paper);
	}

//IMPORT PAPERS BY EXCELL

	@PostMapping("/importPaper/{userId}")
	public ResponseEntity<MessageResponse> importPapersByExcell(@PathVariable("userId") Integer userId, @RequestBody List<List<String>> jsonData) {
		List<String> oldTitles = paperService.findAllPapersByUserId(userId).stream().map(x-> x.getTitle()).toList();
		User user = userService.findUser(userId);
		for(Integer i=1; i<jsonData.size(); i++ ){
			String title = jsonData.get(i).get(1).toString();
			if(!oldTitles.contains(title)){
				Paper newPaper = new Paper();
				newPaper.setTitle(title);
				newPaper.setPublicationYear(Integer.parseInt(jsonData.get(i).get(2)));
				newPaper.setAuthors(jsonData.get(i).get(8));
				newPaper.setDOI(jsonData.get(i).get(4));
				newPaper.setPublicationData(jsonData.get(i).get(5));
				newPaper.setScopus(jsonData.get(i).get(9));
				newPaper.setUser(user);
				newPaper.setPublisher(jsonData.get(i).get(7));
				newPaper.setSource(jsonData.get(i).get(6));

				String excelType = jsonData.get(i).get(3);
				List<PaperType> types = paperService.findPaperTypes();
				Optional<PaperType> paperType = types.stream().filter(x->x.getName().equals(excelType)).findFirst();
				if(paperType.isPresent()){
					newPaper.setType(paperType.get());
				}else{
					PaperType type = types.stream().filter(x->x.getName().equals("Other")).findFirst().get();
					newPaper.setType(type);
				}try {
					paperService.savePaper(newPaper);
				} catch (Exception e) {
				}
				
			}
		}
		System.out.println(jsonData);
		return new ResponseEntity<>(new MessageResponse("Papers added correctly"), HttpStatus.OK);
	}

//IMPORT PAPER BY DOI
	@PostMapping("{userId}/importByDOI")
	public ResponseEntity<MessageResponse> importPapersByDOI(@PathVariable("userId") Integer userId,
		@RequestParam("searchTerm") String searchTerm){
			String url = "https://api.crossref.org/works/"+searchTerm;
			List<String> oldTitles = paperService.findAllPapersByUserId(userId).stream().map(x-> x.getTitle()).toList();
			try {
				String response = restTemplate.getForObject(url, String.class);
	
				// Convertir la respuesta JSON a un objeto JsonNode para acceder a los campos de manera estructurada
				JsonNode jsonResponse = objectMapper.readTree(response);
				User user = userService.findUser(userId);
				Paper newPaper = new Paper();
				// Acceder a los campos de la respuesta JSON
				String title = jsonResponse.get("message").get("title").get(0).asText();
				if(oldTitles.contains(title)) throw new Exception("There is a paper with the same title already");
				String publisher = jsonResponse.get("message").get("publisher").asText();
	            String paper_type = jsonResponse.get("message").get("type").asText();
				
				
				
				String date = jsonResponse.get("message").get("published-print").get("date-parts").get(0).get(0).asText();
				String autores = "";
				JsonNode autoresNode = jsonResponse.path("message").path("author");
				for (JsonNode autor : autoresNode) {
					String firstName = autor.get("given").asText();
					String lastName = autor.get("family").asText();
					autores += lastName + ", " + firstName + ";";
					System.out.println(autores);
				}
					
				String isbnPrint = jsonResponse.get("message").get("isbn-type").get(0).get("value").asText();
				String isbnElectronic = jsonResponse.get("message").get("isbn-type").get(1).get("value").asText();
				newPaper.setTitle(title);
				newPaper.setPublicationYear(Integer.parseInt(date));
				newPaper.setDOI(searchTerm);
				newPaper.setPublisher(publisher);
				newPaper.setPublicationData("isbnPrint: "+isbnPrint + " isbnElectronic: "+ isbnElectronic);
				newPaper.setAuthors(autores);
				newPaper.setUser(user);
				newPaper.setSource("Crossref");
				List<PaperType> types = paperService.findPaperTypes();
				Optional<PaperType> paperType = types.stream().filter(x->x.getName().toLowerCase().equals(paper_type.toLowerCase())).findFirst();
				if(paperType.isPresent()){
					newPaper.setType(paperType.get());
				}else{
					PaperType type = types.stream().filter(x->x.getName().equals("Other")).findFirst().get();
					newPaper.setType(type);
				}
				paperService.savePaper(newPaper);
				return new ResponseEntity<>(new MessageResponse("Paper added correctly"), HttpStatus.OK);
			} catch (Exception e) {
				e.printStackTrace();
				return new ResponseEntity<>(new MessageResponse("Paper can not be added"), HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}

}
