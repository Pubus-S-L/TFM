package org.springframework.samples.pubus.auth.payload.request;

import jakarta.validation.constraints.NotBlank;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequest {
	
	// User

	@NotBlank
	private String username;

	@NotBlank
	private String email;
	
	@NotBlank
	private String authority;

	@NotBlank
	private String password;
	
	@NotBlank
	private String firstName;
	
	@NotBlank
	private String lastName;


}
