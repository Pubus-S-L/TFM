package org.springframework.samples.pubus.company;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/company")
@SecurityRequirement(name = "bearerAuth")
class CompanyRestController {

	private final CompanyService companyService;

	@Autowired
	public CompanyRestController(CompanyService companyService) {
		this.companyService = companyService;

	}

	@GetMapping
	public ResponseEntity<Company> findCompany() {
        Company company = companyService.findAll().stream().findFirst().get();
        return new ResponseEntity<>(company, HttpStatus.OK);

	}

    @PutMapping()
	@ResponseStatus(HttpStatus.OK)
	public ResponseEntity<Company> update(@RequestBody @Valid Company company) {
        Integer id = companyService.findAll().stream().findFirst().get().getId();
		return new ResponseEntity<>(this.companyService.updateCompany(company, id), HttpStatus.OK);
	}

}