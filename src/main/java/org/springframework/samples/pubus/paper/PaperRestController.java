package org.springframework.samples.pubus.paper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Optional;
import jakarta.validation.Valid;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException;
import org.springframework.data.util.Pair;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.pubus.auth.payload.response.MessageResponse;
import org.springframework.samples.pubus.exceptions.ResourceNotOwnedException;
import org.springframework.samples.pubus.paper.exceptions.DuplicatedPaperTitleException;
import org.springframework.samples.pubus.user.User;
import org.springframework.samples.pubus.user.UserService;
import org.springframework.samples.pubus.util.RestPreconditions;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.InitBinder;
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

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.micrometer.core.ipc.http.HttpSender.Response;
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
	private static final Logger logger = LoggerFactory.getLogger(PaperRestController.class);

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
		if (userId != null) {
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
	}

// GET FILTERED

	public ResponseEntity<List<Paper>> searchPaper(String originalSearch) {
		String search = originalSearch.toLowerCase();
		Set<Paper> set_complete = new HashSet<>();

		List<Paper> list1 = this.paperService.findAllPapersByAuthor(search);
		List<Paper> list2 = this.paperService.findAllPapersAbstractWord(search);
		List<Paper> list3 = this.paperService.findAllPapersByKeyword(search);
		List<Paper> list4 = this.paperService.findPaperByTitle(search);

		set_complete.addAll(list1);
		set_complete.addAll(list2);
		set_complete.addAll(list3);
		set_complete.addAll(list4);

		List<Paper> list_complete = set_complete.stream().collect(Collectors.toList());

		return new ResponseEntity<>((List<Paper>) list_complete, HttpStatus.OK);
	}

//UPLOAD FILE

	public ResponseEntity<Paper> uploadFile(Integer paperId, Paper paper, List<MultipartFile> files) {
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
	public ResponseEntity<List<Paper>> findAllByUserId(@PathVariable("userId") int userId, @RequestParam(required = false) String search) {
		return searchPaperByUserId(userId,search);
	}

//SEARCH PAPER BY USERID

	public ResponseEntity<List<Paper>> searchPaperByUserId(int userId, String originalSearch) {
		String search = originalSearch.toLowerCase();
		Set<Paper> set_complete = new HashSet<>();

		List<Paper> list1 = this.paperService.findAllPapersByAuthorAndUser(search, userId);
		List<Paper> list2 = this.paperService.findAllPapersAbstractWordAndUser(search, userId);
		List<Paper> list3 = this.paperService.findAllPapersByKeywordAndUser(search, userId);
		List<Paper> list4 = this.paperService.findPaperByTitleAndUser(search, userId);
		
		set_complete.addAll(list1);
		set_complete.addAll(list2);
		set_complete.addAll(list3);
		set_complete.addAll(list4);

		List<Paper> list_complete = set_complete.stream().collect(Collectors.toList());

		return new ResponseEntity<>((List<Paper>) list_complete, HttpStatus.OK);
	}


//CREATE	

@PostMapping
@ResponseStatus(HttpStatus.CREATED)
public ResponseEntity<Paper> create(
        @RequestParam("title") String title,
        @RequestParam("authors") String authors,
        @RequestParam("publicationYear") String publicationYear,
        @RequestParam("type") String typeJson, // Recibimos el JSON de Type como String
        @RequestParam(value = "publisher", required = false) String publisher,
        @RequestParam(value = "publicationData", required = false) String publicationData,
        @RequestParam(value = "abstractContent", required = false) String abstractContent,
        @RequestParam(value = "keywords", required = false) String keywords,
        @RequestParam(value = "notes", required = false) String notes,
        @RequestParam(value = "source", required = false) String source,
        @RequestParam(value = "scopus", required = false) String scopus,
        @RequestParam("userId") String userId,
        @RequestParam(value = "files", required = false) List<MultipartFile> files)
        throws DataAccessException, DuplicatedPaperTitleException {

    logger.debug("Iniciando creación de Paper (atributos separados)");
    logger.debug("Title recibido: " + title);
    logger.debug("Authors recibido: " + authors);
    logger.debug("Publication Year recibido: " + publicationYear);
    logger.debug("Type JSON recibido: " + typeJson);
    logger.debug("UserId recibido: " + userId);
	logger.debug("Files recibidos: " + (files != null ? files.size() : "null"));

    try {
        Integer id = Integer.parseInt(userId);
        User user = userService.findUser(id);
        logger.debug("Usuario encontrado: " + user);

        // Deserializar el JSON de Type a un objeto Type
        ObjectMapper objectMapper = new ObjectMapper();
        PaperType type = objectMapper.readValue(typeJson, PaperType.class);

        Paper newPaper = new Paper();
        newPaper.setTitle(title);
        newPaper.setAuthors(authors);
        newPaper.setPublicationYear(Integer.parseInt(publicationYear));
        newPaper.setType(type);
        newPaper.setPublisher(publisher);
        newPaper.setPublicationData(publicationData);
        newPaper.setAbstractContent(abstractContent);
        newPaper.setKeywords(keywords);
        newPaper.setNotes(notes);
        newPaper.setSource(source);
        newPaper.setScopus(scopus);
        newPaper.setUser(user);
        logger.debug("Paper antes de guardar: " + newPaper);

        Paper savedPaper = this.paperService.savePaper(newPaper);
        logger.debug("Paper guardado: " + savedPaper);

        if (files != null && !files.isEmpty()) {
            logger.debug("Procesando archivos...");
            return uploadFile(savedPaper.getId(), savedPaper, files);
        }

        return new ResponseEntity<>(savedPaper, HttpStatus.CREATED);
    } catch (Exception e) {
        logger.debug("Error al crear el paper (atributos separados): " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(null);
    }
}

//UPDATE

	@PutMapping("{paperId}")
	@ResponseStatus(HttpStatus.OK)
	public ResponseEntity<Paper> update(@PathVariable("paperId") int paperId, 
		@RequestParam("title") String title,
		@RequestParam("authors") String authors,
		@RequestParam("publicationYear") String publicationYear,
		@RequestParam("type") String typeJson, // Recibimos el JSON de Type como String
		@RequestParam(value = "publisher", required = false) String publisher,
		@RequestParam(value = "publicationData", required = false) String publicationData,
		@RequestParam(value = "abstractContent", required = false) String abstractContent,
		@RequestParam(value = "keywords", required = false) String keywords,
		@RequestParam(value = "notes", required = false) String notes,
		@RequestParam(value = "source", required = false) String source,
		@RequestParam(value = "scopus", required = false) String scopus,
		@RequestParam("userId") String userId,
		@RequestParam(value = "files", required = false) List<MultipartFile> files) {

		Paper aux = RestPreconditions.checkNotNull(paperService.findPaperById(paperId), "Paper", "ID", paperId);
		Integer id = Integer.parseInt(userId);
		User loggedUser = userService.findUser(id);
		User paperUser = aux.getUser();
		Paper newPaper = new Paper();
		ObjectMapper objectMapper = new ObjectMapper();
        PaperType type;

		try {
			type = objectMapper.readValue(typeJson, PaperType.class);
			newPaper.setTitle(title);
			newPaper.setAuthors(authors);
			newPaper.setPublicationYear(Integer.parseInt(publicationYear));
			newPaper.setType(type);
			newPaper.setPublisher(publisher);
			newPaper.setPublicationData(publicationData);
			newPaper.setAbstractContent(abstractContent);
			newPaper.setKeywords(keywords);
			newPaper.setNotes(notes);
			newPaper.setSource(source);
			newPaper.setScopus(scopus);
			newPaper.setUser(paperUser);

			if (loggedUser.getId().equals(paperUser.getId())) {
				if(files!=null){
					Paper paper = paperService.updatePaper(newPaper, paperId);
					ResponseEntity<Paper> res = uploadFile(paperId, paper, files);
					return res;
				}
				else{
					Paper res = paperService.updatePaper(newPaper, paperId);
					return new ResponseEntity<>(res, HttpStatus.OK);
				}
			} else
				throw new ResourceNotOwnedException(aux);
		 } catch (JsonMappingException e) {
			return ResponseEntity
			.status(HttpStatus.INTERNAL_SERVER_ERROR)
			.body(null);
		} catch (JsonProcessingException e) {
			logger.debug("Error al crear el paper (atributos separados): " + e.getMessage());
			e.printStackTrace();
			return ResponseEntity
					.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(null);
		}
	}

//DELETE	

	@DeleteMapping("{paperId}")
	@ResponseStatus(HttpStatus.OK)
	public ResponseEntity<MessageResponse> delete(@PathVariable("paperId") int paperId) {
		Paper paper = RestPreconditions.checkNotNull(paperService.findPaperById(paperId), "Paper", "ID", paperId);
		paperService.deletePaper(paperId);
		return new ResponseEntity<>(new MessageResponse("Paper deleted!"), HttpStatus.OK);
	}

//DELETE PAPERFILE

	@DeleteMapping("{paperId}/delete/{paperFileId}")
	@ResponseStatus(HttpStatus.OK)
	public ResponseEntity<MessageResponse> deletePaperFile(@PathVariable("paperFileId") int paperFileId) {
		PaperFile paperFile = RestPreconditions.checkNotNull(paperFileService.getPaperFileById(paperFileId), "PaperField", "ID", paperFileId);
		paperFileService.deletePaperFile(paperFileId);
		return new ResponseEntity<>(new MessageResponse("File deleted!"), HttpStatus.OK);

	}

//IMPORT PAPERS BY EXCELL

	@PostMapping("/importPaper/{userId}")
	public ResponseEntity<MessageResponse> importPapersByExcell(@PathVariable("userId") Integer userId, @RequestBody List<String> jsonData) {
		List<String> oldTitles = new ArrayList<>();
		oldTitles = paperService.findAllPapersByUserId(userId).stream().map(x-> x.getTitle()).toList();
		User user = userService.findUser(userId);
		String title = jsonData.get(1).toString();
			if(!oldTitles.contains(title)){

					Paper newPaper = new Paper();
					newPaper.setTitle(title);
					newPaper.setPublicationYear(Integer.parseInt(jsonData.get(2)));
					newPaper.setAuthors(jsonData.get(8));
					newPaper.setDOI(jsonData.get(4));
					newPaper.setPublicationData(jsonData.get(5));
					newPaper.setScopus(jsonData.get(9));
					newPaper.setUser(user);
					newPaper.setPublisher(jsonData.get(7));
					newPaper.setSource(jsonData.get(6));
	
					String excelType = jsonData.get(3);
					List<PaperType> types = paperService.findPaperTypes();
					Optional<PaperType> paperType = types.stream().filter(x->x.getName().equals(excelType)).findFirst();
					if(paperType.isPresent()){
						newPaper.setType(paperType.get());
					}else{
						PaperType type = types.stream().filter(x->x.getName().equals("Other")).findFirst().get();
						String min_excelType = excelType.toLowerCase();
						switch (min_excelType) {
							case "artículo":
								type = types.stream().filter(x->x.getName().equals("Article")).findFirst().get();
								break;
							case "libro":
								type = types.stream().filter(x->x.getName().equals("Book")).findFirst().get();
								break;
							case "tesis":
								type = types.stream().filter(x->x.getName().equals("Thesis")).findFirst().get();
								break;
							case "reporte técnico":
								type = types.stream().filter(x->x.getName().equals("Technical-report")).findFirst().get();
								break;
							case "disertación":
								type = types.stream().filter(x->x.getName().equals("Dissertation")).findFirst().get();
								break;
							case "ensayo":
								type = types.stream().filter(x->x.getName().equals("Essay")).findFirst().get();
								break;
							case "documento":
								type = types.stream().filter(x->x.getName().equals("Paper")).findFirst().get();
								break;
							case "capítulo":
								type = types.stream().filter(x->x.getName().equals("Book-chapter")).findFirst().get();
								break;
							case "cuaderno":
								type = types.stream().filter(x->x.getName().equals("Booklet")).findFirst().get();
								break;
							case "ponencia":
								type = types.stream().filter(x->x.getName().equals("Conference")).findFirst().get();
								break;
							case "conferencia":
								type = types.stream().filter(x->x.getName().equals("Conference")).findFirst().get();
								break;
						}
						newPaper.setType(type);
					}	
					try {
						paperService.savePaper(newPaper);
					} catch (Exception e) {
					}
				
			}
		return new ResponseEntity<>(new MessageResponse("Papers added correctly"), HttpStatus.OK);
	}

	

//IMPORT PAPER BY DOI
	@PostMapping("{userId}/importByDOI")
	public ResponseEntity<MessageResponse> importPapersByDOI(@PathVariable("userId") Integer userId,
		@RequestParam("searchTerm") String searchTerm){
			String url = "https://api.crossref.org/works/"+searchTerm;
			List<String> oldTitles = new ArrayList<>();
			oldTitles.addAll(paperService.findAllPapersByUserId(userId).stream().map(x-> x.getTitle()).toList());


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

//LIKE

		@PostMapping("{userId}/like/{paperId}")
		public ResponseEntity<String> likePaper(@PathVariable("paperId") Integer paperId, @PathVariable(value = "userId", required = false) String userId){
			Paper paper = paperService.findPaperById(paperId);
			Integer userIdInt = Integer.parseInt(userId);
			User user = userService.findUser(userIdInt);
			if(!user.getFavorites().contains(paperId)){
				paper.setLikes(paper.getLikes()+1);
				user.getFavorites().add(paper.getId());
				paperService.savePaper(paper);
				userService.saveUser(user);
				return ResponseEntity.ok("You liked this paper");
			}else{
				paper.setLikes(paper.getLikes()-1);
				user.getFavorites().remove(paper.getId());
				paperService.savePaper(paper);
				userService.saveUser(user);
				return ResponseEntity.ok("You took off your like");
			}

		}

//PROMPT

		@GetMapping("/users/{userId}/prompt")
		public ResponseEntity<Map<String,String>> createPrompt(@RequestParam("text") String text, @PathVariable("userId") Integer userId){
			try{
				byte [] embedding = paperFileService.getEmbeddingFromOpenAI(text);
				Pair<Integer,String> context = paperFileService.getContext(embedding, userId);
				Paper paper = paperFileService.getPaperFileById(context.getFirst()).getPaper();
				String enlace = (paper.getDOI()!="" && paper.getDOI()!=null) ? "https://doi.org/" + paper.getDOI() : "http://localhost:3000/papers/" + paper.getId();
				String apa = paper.getAuthors() + ". (" + paper.getPublicationYear() + "). " + paper.getTitle() + ". " + enlace;
				String prompt = "Your are an asistant. Resolve this request: "+text + " using this context " + context.getSecond();;
				Map<String, String> response = new HashMap<>();
				response.put("prompt", prompt);
				response.put("reference", apa);
				
				return ResponseEntity.ok(response);

			}catch(Exception e){
				return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Error"));
			}

		}
}
