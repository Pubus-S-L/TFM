package org.springframework.samples.pubus.company;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import javax.swing.text.html.Option;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.samples.pubus.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyService {
    	private CompanyRepository companyRepository;

	@Autowired
	public CompanyService(CompanyRepository companyRepository) {
		this.companyRepository = companyRepository;
	}

    @Transactional(readOnly = true)
	public Collection<Company> findAll() {
		return (List<Company>) companyRepository.findAll();
	}

	@Transactional(readOnly = true)
	public Company findCompany(Integer id) {
		return companyRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Company", "id", id));
	}

	@Transactional
	public Company saveCompany(Company company) throws DataAccessException {
	    return companyRepository.save(company);
	}

    
	@Transactional
	public Company updateCompany(Company company, int id) throws DataAccessException {
		Optional<Company> toUpdate = companyRepository.findById(id);

        if(toUpdate.isPresent()){
            BeanUtils.copyProperties(company, toUpdate, "id");
            return saveCompany(toUpdate.get());
        }else {
            throw new ResourceNotFoundException("Company", "ID", id);

	}
}

}
