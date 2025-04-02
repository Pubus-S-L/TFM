package org.springframework.samples.pubus.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.pubus.auth.payload.request.LoginRequest;
import org.springframework.samples.pubus.auth.payload.request.SignupRequest;
import org.springframework.samples.pubus.auth.payload.response.MessageResponse;
import org.springframework.samples.pubus.configuration.jwt.JwtUtils;
import org.springframework.samples.pubus.user.UserService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.client.RestTemplate;
import static org.mockito.ArgumentMatchers.anyString;


@SpringBootTest
@AutoConfigureTestDatabase

public class AuthControllerTest {
    
    @Mock
    private UserService userService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private AuthService authService;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRegisterUser_Success() {
        // Arrange
        when(userService.existsUser(anyString())).thenReturn(false);

        // Act
        ResponseEntity<MessageResponse> responseEntity = authController.registerUser(new SignupRequest());

        // Assert
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
    }

    @Test
    void testValidateToken_InvalidToken() {
        // Arrange
        when(jwtUtils.validateJwtToken(anyString())).thenReturn(false);

        // Act
        ResponseEntity<Boolean> responseEntity = authController.validateToken("invalid_token");

        // Assert
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertFalse(responseEntity.getBody());
    }

    @Test
    public void testCreateLoginRequest_Success() {
    String username = "test_user";
    String password = "password123";
    
    authController = new AuthController(authenticationManager, userService, jwtUtils, authService, restTemplate);
    LoginRequest request = authController.createLoginRequest(username, password);
    
    assertEquals(username, request.getUsername());
    assertEquals(password, request.getPassword());
    }

    @Test
    public void testValidateToken_Success() throws Exception {
    // Mock data
    String validToken = "your_valid_jwt_token";
    
    // Mock behavior
    when(jwtUtils.validateJwtToken(validToken)).thenReturn(true);
    
    // Call the method
    authController = new AuthController(authenticationManager, userService, jwtUtils, authService, restTemplate);
    ResponseEntity<Boolean> response = authController.validateToken(validToken);
    
    // Assertions
    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertEquals(true, response.getBody());
    }

    @Test
    public void testRegisterUser_UsernameExists() {
      // Mock data
      SignupRequest signupRequest = new SignupRequest();
      signupRequest.setUsername("existing_user");
      signupRequest.setPassword("password123");

    
      // Mock behavior
      when(userService.existsUser(signupRequest.getUsername())).thenReturn(true);
      
      // Call the method
      authController = new AuthController(authenticationManager, userService, jwtUtils, authService, restTemplate);
      ResponseEntity<MessageResponse> response = authController.registerUser(signupRequest);
      
      // Assertions
      assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
      assertEquals("Error: Username is already taken!", response.getBody().getMessage());

    }

    @Test
    public void testAuthenticateUser_BadCredentials() throws Exception {
        // Mock data
        String username = "test_user";
        String password = "wrong_password";
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(username, password);

        // Mock behavior (no need to mock successful authentication)
        when(authenticationManager.authenticate(authenticationToken)).thenThrow(new BadCredentialsException("Invalid credentials"));

        // Call the method
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setPassword(password);
        loginRequest.setUsername(username);
        authController = new AuthController(authenticationManager, userService, jwtUtils, authService, restTemplate);
        ResponseEntity<String> response = authController.authenticateUser(loginRequest);

        // Assertions
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Bad Credentials!", response.getBody());
    }
}
