package org.springframework.samples.pubus.paper;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.samples.pubus.exceptions.ResourceNotFoundException;
import org.springframework.samples.pubus.paper.exceptions.DuplicatedPaperTitleException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;

@Service
public class PaperService {

	private PaperRepository paperRepository;
	private PaperFileService paperFileService;

	@Autowired
	public PaperService(PaperRepository paperRepository, PaperFileService paperFileService) {
		this.paperFileService = paperFileService;
		this.paperRepository = paperRepository;
	}

	@Transactional(readOnly = true)
	public List<PaperType> findPaperTypes() throws DataAccessException {
		return paperRepository.findPaperTypes();
	}

	@Transactional(readOnly = true)
	public Collection<Paper> findAll() {
		return (List<Paper>) paperRepository.findAll();
	}

	@Transactional(readOnly = true)
	public Paper findPaperById(int id) throws DataAccessException {
		return paperRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Paper", "ID", id));
	}

	@Transactional(readOnly = true)
	public List<Paper> findPaperByTitle(String title) {
		return paperRepository.findByTitle(title);
	}

	@Transactional(readOnly = true)
	public List<Paper> findAllPapersAbstractWord(String word) throws DataAccessException {
		return paperRepository.findAllPapersByAbstractWord(word);
	}

	@Transactional(readOnly = true)
	public List<Paper> findAllPapersByKeyword(String keyword) throws DataAccessException {
		return paperRepository.findAllPapersByKeyWord(keyword);
	}

	@Transactional(readOnly = true)
	public List<Paper> findAllPapersByType(String paperType) throws DataAccessException {
		return paperRepository.findAllPapersByPaperType(paperType);
	}

	@Transactional(readOnly = true)
	public List<Paper> findAllPapersByAuthor(String author) throws DataAccessException {
		return paperRepository.findAllPapersByAuthor(author);
	}

	@Transactional(readOnly = true)
	public List<Paper> findAllPapersByUserId(int id) throws DataAccessException {
		return paperRepository.findAllPapersByUserId(id);
	}

	@Transactional(readOnly = true)
	public List<Paper> findPaperByTitleAndUser(String title, Integer id) throws DataAccessException {
		return paperRepository.findByTitleAndUser(title, id);
	}

	@Transactional(readOnly = true)
	public List<Paper> findAllPapersAbstractWordAndUser(String word, Integer id) throws DataAccessException {
		return paperRepository.findAllPapersByAbstractWordAndUser(word,id);
	}

	@Transactional(readOnly = true)
	public List<Paper> findAllPapersByKeywordAndUser(String keyword, Integer id) throws DataAccessException {
		return paperRepository.findAllPapersByKeyWordAndUser(keyword,id);
	}

	@Transactional(readOnly = true)
	public List<Paper> findAllPapersByAuthorAndUser(String author, Integer id) throws DataAccessException {
		return paperRepository.findAllPapersByAuthorAndUser(author,id);
	}

	@Transactional(rollbackFor = DuplicatedPaperTitleException.class)
	public Paper savePaper(Paper paper) throws DataAccessException, DuplicatedPaperTitleException {
		Paper otherPaper = getPaperWithTitleAndIdDifferent(paper);
		if (otherPaper != null && !otherPaper.getId().equals(paper.getId())) {
			throw new DuplicatedPaperTitleException();
		} else{
			Map<String, byte[]> embeddings = paperFileService.addEmbedding(paper.getTitle(), new HashMap<>());
			paper.setEmbeddings(embeddings);
			paperRepository.save(paper);
		}
			
		return paper;
	}

	public Paper getPaperWithTitleAndIdDifferent(Paper paper) {
		String title = paper.getTitle().toLowerCase();
		for (Paper p : findAllPapersByUserId(paper.getUser().getId())) {
			String compareTitle = p.getTitle().toLowerCase();
			if (compareTitle.equals(title) && !p.getId().equals(paper.getId())) {
				return p;
			}
		}
		return null;
	}

	@Transactional
	public Paper updatePaper(Paper paper, int id) {
		System.out.println("Inicio de updatePaper con id: " + id);
		Paper toUpdate = findPaperById(id);
		System.out.println("Paper encontrado para actualizar: " + toUpdate);
		
		if (paper.getTitle() != null && !paper.getTitle().equals(toUpdate.getTitle())) {
			System.out.println("Actualizando embedding para título: " + paper.getTitle());
			Map<String, byte[]> embeddings = paperFileService.addEmbedding(paper.getTitle(), new HashMap<>());
			toUpdate.setEmbeddings(embeddings);
		}
		
		BeanUtils.copyProperties(paper, toUpdate, "id");
		System.out.println("Paper después de copyProperties: " + toUpdate);
		
		Paper result = savePaper(toUpdate);
		System.out.println("Paper después de guardar: " + result);
		return result;
	}

	@Transactional
	public void deletePaper(int id) throws DataAccessException {
		Paper toDelete = findPaperById(id);
		paperRepository.delete(toDelete);
	}

	public Map<String, Object> getPapersStats() {
		Map<String, Object> res = new HashMap<>();
		Integer countAll = this.paperRepository.countAll();
		int users = this.paperRepository.countAllUsers();
		Double avgPapersByUser = (double) countAll / users;
		Map<String, Integer> papersByType = getPapersByType();

		res.put("totalPapers", countAll);
		res.put("avgPapersByUser", avgPapersByUser);
		res.put("papersByType", papersByType);

		return res;
	}

	private Map<String, Integer> getPapersByType() {
		Map<String, Integer> unsortedPapersByType = new HashMap<>();
		this.paperRepository.countPapersGroupedByType().forEach(m -> {
			String key = m.get("type");
			Integer value = Integer.parseInt(m.get("papers"));
			unsortedPapersByType.put(key, value);
		});
		return unsortedPapersByType;
	}

	public List<Paper> findRecommendedPapers(List<Paper> papers) {
		List<Paper> recommendedPapers = new ArrayList<>();
		if(papers.size()>3){
			papers = papers.subList(0, 3);
		}
		List<byte[]> data = new ArrayList<>();
		for (Paper paper : papers) {
			for(Map.Entry<String, byte[]> entry : paper.getEmbeddings().entrySet()){
				data.add(entry.getValue());
			}
		}
		try {
			String[] titles = paperFileService.getContextRecommended(data);
			for(String t: titles){
				if(t != ""){
					Paper paper = paperRepository.findByExactTitle(t);
					recommendedPapers.add(paper);
				}
			}

		} catch (JsonProcessingException e) {
			e.printStackTrace();
		}
		return recommendedPapers;
	}
}
