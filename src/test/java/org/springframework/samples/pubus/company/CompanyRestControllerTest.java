package org.springframework.samples.pubus.company;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Arrays;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class CompanyRestControllerTest {
 @Mock
    private CompanyService companyService;

    @InjectMocks
    private CompanyRestController companyRestController;

    private Company company;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        company = new Company();
        company.setId(1);
        company.setName("Test Company");
        company.setDescription("Test Company");
        company.setDirection("Avenida test sn");
        company.setEmail("company@test.com");
        company.setPhone(999999999);
        company.setSupportEmail("company@test.com");
        company.setSupportPhone(999999999);
    }

    @Test
    public void testFindCompany() {
        when(companyService.findAll()).thenReturn(Arrays.asList(company));

        ResponseEntity<Company> responseEntity = companyRestController.findCompany();

        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(company, responseEntity.getBody());
    }

    @Test
    public void testUpdateCompany() {
        when(companyService.findAll()).thenReturn(Arrays.asList(company));
        when(companyService.updateCompany(any(Company.class), any(Integer.class))).thenReturn(company);

        ResponseEntity<Company> responseEntity = companyRestController.update(company);

        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(company, responseEntity.getBody());
    }
}
