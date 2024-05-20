package org.springframework.samples.pubus.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

import java.util.HashMap;
import java.util.Map;

import org.json.JSONObject;
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
import org.springframework.samples.pubus.auth.payload.response.JwtResponse;
import org.springframework.samples.pubus.auth.payload.response.MessageResponse;
import org.springframework.samples.pubus.configuration.jwt.JwtUtils;
import org.springframework.samples.pubus.user.User;
import org.springframework.samples.pubus.user.UserService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.client.RestTemplate;
import static org.junit.Assert.*;
import java.util.Optional;
import org.springframework.samples.pubus.exceptions.ResourceNotFoundException;
import org.springframework.security.core.context.SecurityContext;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

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
        when(authService.createUsername(anyString(), anyString())).thenReturn("username");

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
}
