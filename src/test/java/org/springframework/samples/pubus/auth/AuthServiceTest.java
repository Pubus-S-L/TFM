package org.springframework.samples.pubus.auth;

import static org.junit.Assert.*;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Optional;
import org.apache.tomcat.util.net.openssl.ciphers.Authentication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.samples.pubus.auth.AuthService;
import org.springframework.samples.pubus.auth.payload.request.SignupRequest;
import org.springframework.samples.pubus.configuration.jwt.JwtUtils;
import org.springframework.samples.pubus.exceptions.ResourceNotFoundException;
import org.springframework.samples.pubus.user.Authorities;
import org.springframework.samples.pubus.user.AuthoritiesService;
import org.springframework.samples.pubus.user.User;
import org.springframework.samples.pubus.user.UserService;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestTemplate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
@AutoConfigureTestDatabase
public class AuthServiceTest {
@Mock
    private PasswordEncoder encoder;

    @Mock
    private AuthoritiesService authoritiesService;

    @Mock
    private UserService userService;

    @Mock
    private JwtUtils jwtUtils;



    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }


    // @Test
    // void testQuitarTildes() throws Exception {
    //     Method quitarTildesMethod = AuthService.class.getDeclaredMethod("quitarTildes", String.class);
    //     quitarTildesMethod.setAccessible(true);

    //     String result = (String) quitarTildesMethod.invoke(authService, "áéíóúÁÉÍÓÚ");

    //     assertEquals("aeiouaeiou", result);
    // }

    @Test
    public void testCreateUser_SuccessAdminRole() {
        // Mock data
        SignupRequest request = new SignupRequest();
        request.setUsername("admin");
        request.setPassword("password123");
        request.setFirstName("John");
        request.setLastName("Doe");
        request.setEmail("johndoe@example.com");
        request.setAuthority("ADMIN");

        // Mock behavior
        User expectedUser = new User();
        expectedUser.setUsername(request.getUsername());
        expectedUser.setPassword(encoder.encode(request.getPassword())); // Mocked encoding
        expectedUser.setFirstName(request.getFirstName());
        expectedUser.setLastName(request.getLastName());
        expectedUser.setEmail(request.getEmail());
        Authorities adminRole = new Authorities(); // Mock Authorities object
        adminRole.setAuthority("ADMIN");
        when(authoritiesService.findByAuthority(request.getAuthority())).thenReturn(adminRole);
        when(userService.saveUser(expectedUser)).thenReturn(expectedUser);

        // Call the method
        authService = new AuthService(encoder, authoritiesService, userService, jwtUtils, restTemplate);
        authService.createUser(request);

        // Verify interactions
        verify(authoritiesService).findByAuthority(request.getAuthority());
        
}

}
