package org.springframework.samples.pubus.auth;

import java.util.List;
import java.util.stream.Collectors;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.pubus.auth.payload.request.LoginRequest;
import org.springframework.samples.pubus.auth.payload.request.SignupRequest;
import org.springframework.samples.pubus.auth.payload.response.JwtResponse;
import org.springframework.samples.pubus.auth.payload.response.MessageResponse;
import org.springframework.samples.pubus.configuration.jwt.JwtUtils;
import org.springframework.samples.pubus.configuration.services.UserDetailsImpl;
import org.springframework.samples.pubus.user.UserService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.security.authentication.BadCredentialsException;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "The Authentication API based on JWT")
public class AuthController {

	private final AuthenticationManager authenticationManager;
	private final UserService userService;
	private final JwtUtils jwtUtils;
	private final AuthService authService;
	private RestTemplate restTemplate;
	
    private String clientId = "77bspiilcaqccb";
	private String clientSecret = "znhIqqme8HQBklum";
	private String url = "https://www.linkedin.com/oauth/v2/accessToken";
    private String redirectUri = "http://localhost:3000/linkedInLogin";

	@Autowired
	public AuthController(AuthenticationManager authenticationManager, UserService userService, JwtUtils jwtUtils,
			AuthService authService, RestTemplate restTemplate) {
		this.userService = userService;
		this.jwtUtils = jwtUtils;
		this.authenticationManager = authenticationManager;
		this.authService = authService;
		this.restTemplate = restTemplate;
	}

// 	@PostMapping("/linkedin/login")
//     public ResponseEntity<String> linkedInLogin(@RequestBody String code) {
//         JSONObject jsonObject = new JSONObject(code);
//         String parse_code = jsonObject.getString("code");

//         // Redirigir al usuario al flujo de autorización de LinkedIn nuevamente
//         String authorizationUrl = "https://www.linkedin.com/oauth/v2/authorization?"
//                 + "response_type=code&"
//                 + "client_id=" + clientId + "&"
//                 + "redirect_uri=" + redirectUri + "&"
//                 + "state=STATE&" // Puedes incluir un estado opcional para protección contra CSRF
//                 + "scope=r_liteprofile%20r_emailaddress"; // Especifica los permisos requeridos

//         // Redirige al usuario a la página de autorización de LinkedIn
//         return ResponseEntity.status(HttpStatus.FOUND)
//                 .header("Location", authorizationUrl)
//                 .body("");
//     }

// 	@PostMapping("/loginLinkedIn")
// 	public ResponseEntity<String> linkedInCallBack(@Valid @RequestBody String code) {
//     JSONObject jsonObject = new JSONObject(code);
//     String parse_code = jsonObject.getString("code");
//     RestTemplate restTemplate = new RestTemplate();

//     // Construir la URL de solicitud de token de acceso
//     String accessTokenUrl = "https://www.linkedin.com/oauth/v2/accessToken?"
//             + "grant_type=authorization_code&"
//             + "code=" + parse_code + "&"
//             + "client_id=" + clientId + "&"
//             + "client_secret=" + clientSecret + "&"
//             + "redirect_uri=" + redirectUri;

//     try {
//         // Realizar la solicitud para obtener el token de acceso
//         ResponseEntity<Map> response = restTemplate.exchange(accessTokenUrl, HttpMethod.POST, null, Map.class);
//         if (response.getStatusCode() == HttpStatus.OK) {
//             String accessToken = (String) response.getBody().get("access_token");

//             // Construir la URL para obtener los datos del perfil del usuario
//             String profileUrl = "https://api.linkedin.com/v2/userinfo";
//             HttpHeaders headers = new HttpHeaders();
//             headers.set("Authorization", "Bearer " + accessToken);
//             RequestEntity<?> requestEntity = new RequestEntity<>(headers, HttpMethod.GET, URI.create(profileUrl));

//             // Realizar la solicitud GET para obtener los datos del perfil del usuario
//             ResponseEntity<String> profileResponseEntity = restTemplate.exchange(requestEntity, String.class);
//             String userProfile = profileResponseEntity.getBody();
			
// 			// Mapear los datos del perfil para obtener el givenName, familyName, email
// 			ObjectMapper objectMapper = new ObjectMapper();
// 			JsonNode rootNode = objectMapper.readTree(userProfile);
// 			String givenName = rootNode.get("given_name").asText();
// 			String familyName = rootNode.get("family_name").asText();
// 			String email = rootNode.get("email").asText();
// 			String password = rootNode.get("sub").asText();

// 			//Preguntar si ya existe un usuario con ese correo electrónico
// 			try{
// 				User user = userService.findUser(email);
// 				LoginRequest loginRequest = createLoginRequest(user.getUsername(), user.getPassword());
// 				return authenticateUser(loginRequest);
// 			}catch (ResourceNotFoundException e){
// 				SignupRequest signupRequest = new SignupRequest();
// 				signupRequest.setEmail(email);
// 				signupRequest.setFirstName(givenName);
// 				signupRequest.setLastName(familyName);
// 				signupRequest.setPassword(password);
// 				signupRequest.setAuthority("USER");
// 				String username = authService.createUsername(givenName, familyName);
// 				signupRequest.setUsername(username);
// 				ResponseEntity<MessageResponse>  registerResponse = registerUser(signupRequest);
// 				LoginRequest loginRequest = createLoginRequest(username, password);
// 				return authenticateUser(loginRequest);
// 			}

//         } else {
//             return ResponseEntity.badRequest().body("Failed to obtain access token!");
//         }
//     } catch (Exception e) {
//         return ResponseEntity.badRequest().body("Error: " + e.getMessage());
//     }
// }

	LoginRequest createLoginRequest(String username, String password){
		LoginRequest loginRequest = new LoginRequest();
		loginRequest.setUsername(username);
		loginRequest.setPassword(password);
		return loginRequest;
	}


	@PostMapping("/signin")
	public ResponseEntity authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

			try{
				Authentication authentication = authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));
	
				SecurityContextHolder.getContext().setAuthentication(authentication);
				String jwt = jwtUtils.generateJwtToken(authentication);
	
				UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
				List<String> roles = userDetails.getAuthorities().stream().map(item -> item.getAuthority())
					.collect(Collectors.toList());
	
				return ResponseEntity.ok().body(new JwtResponse(jwt, userDetails.getId(), userDetails.getUsername(), roles));
			}catch(BadCredentialsException exception){
				return ResponseEntity.badRequest().body("Bad Credentials!");
			}	
	}

	@GetMapping("/validate")
	public ResponseEntity<Boolean> validateToken(@RequestParam String token) {
		Boolean isValid = jwtUtils.validateJwtToken(token);
		return ResponseEntity.ok(isValid);
	}

	
	@RequestMapping(value = "/signup", method = {RequestMethod.POST, RequestMethod.OPTIONS})
	public ResponseEntity<MessageResponse> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
		System.out.println("Signup request received: " + signUpRequest.getUsername());
		if (userService.existsUser(signUpRequest.getUsername()).equals(true)) {
			return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
		}
		authService.createUser(signUpRequest);
		return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
	}
}
