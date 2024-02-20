package org.springframework.samples.pubus.paper;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.samples.pubus.exceptions.ResourceNotFoundException;
import org.springframework.samples.pubus.paper.exceptions.DuplicatedPaperTitleException;
import org.springframework.samples.pubus.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaperService {

	private PaperRepository paperRepository;

	@Autowired
	public PaperService(PaperRepository paperRepository) {
		this.paperRepository = paperRepository;
	}

	@Transactional(readOnly = true)
	public List<PaperType> findPaperTypes() throws DataAccessException {
		return paperRepository.findPaperTypes();
	}

	// @Transactional(readOnly = true)
	// public PaperType findPaperTypeByName(String name) throws DataAccessException {
	// 	return paperRepository.findPaperTypeByName(name)
	// 			.orElseThrow(() -> new ResourceNotFoundException("PaperType", "name", name));
	// }

	@Transactional(readOnly = true)
	public Collection<Paper> findAll() {
		return (List<Paper>) paperRepository.findAll();
	}

	@Transactional(readOnly = true)
	public Paper findPaperById(int id) throws DataAccessException {
		return paperRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Paper", "ID", id));
	}

	@Transactional(readOnly = true)
	public Paper findPaperByTitle(String title) throws DataAccessException {
		return paperRepository.findByTitle(title).orElseThrow(() -> new ResourceNotFoundException("Paper", "Title", title));
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

	@Transactional(rollbackFor = DuplicatedPaperTitleException.class)
	public Paper savePaper(Paper paper) throws DataAccessException, DuplicatedPaperTitleException {
		Paper otherPaper = getPaperWithTitleAndIdDifferent(paper);
		if (otherPaper != null && !otherPaper.getId().equals(paper.getId())) {
			throw new DuplicatedPaperTitleException();
		} else
			paperRepository.save(paper);
		return paper;
	}

	private Paper getPaperWithTitleAndIdDifferent(Paper paper) {
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
		Paper toUpdate = findPaperById(id);
		BeanUtils.copyProperties(paper, toUpdate, "id");
		return savePaper(toUpdate);
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
}
