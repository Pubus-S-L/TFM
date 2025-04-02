package org.springframework.samples.pubus.company;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collection;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.samples.pubus.exceptions.ResourceNotFoundException;

public class CompanyServiceTest {

     @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private CompanyService companyService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testFindAll() {
        Company company1 = new Company();
        Company company2 = new Company();
        when(companyRepository.findAll()).thenReturn(Arrays.asList(company1, company2));

        Collection<Company> result = companyService.findAll();

        assertEquals(2, result.size());
        verify(companyRepository, times(1)).findAll();
    }

    @Test
    public void testFindCompany_CompanyFound() {
        Integer id = 1;
        Company company = new Company();
        when(companyRepository.findById(id)).thenReturn(Optional.of(company));

        Company result = companyService.findCompany(id);

        assertEquals(company, result);
        verify(companyRepository, times(1)).findById(id);
    }

    @Test
    public void testFindCompany_CompanyNotFound() {
        Integer id = 1;
        when(companyRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            companyService.findCompany(id);
        });
    }

    @Test
    public void testSaveCompany() {
        Company company = new Company();
        when(companyRepository.save(company)).thenReturn(company);

        Company result = companyService.saveCompany(company);

        assertEquals(company, result);
        verify(companyRepository, times(1)).save(company);
    }

    @Test
    public void testUpdateCompany_CompanyFound() {
        Integer id = 1;
        Company company = new Company();
        Company updatedCompany = new Company();
        updatedCompany.setName("Updated Name");

        when(companyRepository.findById(id)).thenReturn(Optional.of(company));
        when(companyRepository.save(company)).thenReturn(updatedCompany);

        assertEquals("Updated Name", updatedCompany.getName());
        verify(companyRepository, times(1)).findById(id);
        verify(companyRepository, times(1)).save(company);
    }

    @Test
    public void testUpdateCompany_CompanyNotFound() {
        Integer id = 1;
        Company company = new Company();
        when(companyRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            companyService.updateCompany(company, id);
        });
    }
}
