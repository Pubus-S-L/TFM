package org.springframework.samples.pubus.auth;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.samples.pubus.auth.payload.request.SignupRequest;
import org.springframework.samples.pubus.user.Authorities;
import org.springframework.samples.pubus.user.AuthoritiesService;
import org.springframework.samples.pubus.user.User;
import org.springframework.samples.pubus.user.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.samples.pubus.configuration.jwt.JwtUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

	private final PasswordEncoder encoder;
	private final AuthoritiesService authoritiesService;
	private final JwtUtils jwtUtils;
	private final UserService userService;
	private RestTemplate restTemplate;

	@Autowired
	public AuthService(PasswordEncoder encoder, AuthoritiesService authoritiesService, UserService userService, JwtUtils jwtUtils, RestTemplate restTemplate) {
		this.encoder = encoder;
		this.jwtUtils = jwtUtils;
		this.authoritiesService = authoritiesService;
		this.userService = userService;
		this.restTemplate = restTemplate;
	}

	@Transactional
	public void createUser(@Valid SignupRequest request) {
		User user = new User();
		user.setUsername(request.getUsername());
		user.setPassword(encoder.encode(request.getPassword()));
		user.setFirstName(request.getFirstName());
		user.setLastName(request.getLastName());
		user.setEmail(request.getEmail());
		String strRoles = request.getAuthority();
		Authorities role;

		switch (strRoles.toLowerCase()) {
		case "admin":
			role = authoritiesService.findByAuthority("ADMIN");
			user.setAuthority(role);
			userService.saveUser(user);
			break;
		default:
			role = authoritiesService.findByAuthority("USER");
			user.setAuthority(role);
			userService.saveUser(user);
		}
	}

	// public String createUsername(String firstName, String lastName){

	// 	String first = "";
	// 	String last = "";
	// 	Integer num = 1;
	// 	if(firstName.length()>=4){
	// 		first = firstName.substring(0, 4);		
	// 	}
	// 	else{
	// 		first = firstName;
	// 	}
	// 	if(lastName.length()>=4){
	// 		last = lastName.substring(0, 4);	
	// 	}
	// 	else{
	// 		last = lastName;
	// 	}
	// 	String username = first + last;
	// 	if(!userService.existsUser(username)){
	// 		return username.toLowerCase();
	// 	}else{
	// 		username = first + last + num.toString();
	// 		while(userService.existsUser(username)){
	// 			num +=1;
	// 			username = first + last + num.toString();
	// 		}
	// 		username = quitarTildes(username);
	// 		return username.toLowerCase();
	// 	}
	// }

	// private String quitarTildes(String cadena){
	// 	return cadena.replaceAll("[áÁ]", "a")
	// 	.replaceAll("[éÉ]", "e")
	// 	.replaceAll("[íÍ]", "i")
	// 	.replaceAll("[óÓ]", "o")
	// 	.replaceAll("[úÚ]", "u");
	// }

}
