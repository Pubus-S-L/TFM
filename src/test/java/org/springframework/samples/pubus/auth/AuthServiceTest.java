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
import org.springframework.samples.pubus.user.AuthoritiesService;
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
    // void testCreateUserWithAdminRole() {
    //     SignupRequest request = new SignupRequest();
    //     request.setUsername("testuser");
    //     request.setPassword("password");
    //     request.setFirstName("Test");
    //     request.setLastName("User");
    //     request.setEmail("test@example.com");
    //     request.setAuthority("admin");
    
    //     Authorities adminRole = new Authorities();
    //     adminRole.setAuthority("ADMIN");
    
    //     when(authoritiesService.findByAuthority("ADMIN")).thenReturn(adminRole);
    //     when(encoder.encode(any(String.class))).thenReturn("encodedPassword");
    
    //     authService.createUser(request);
    
    //     verify(authoritiesService, times(1)).findByAuthority("ADMIN");
    //     verify(userService, times(1)).saveUser(any(User.class));
    // }
    
    // @Test
    // void testCreateUserWithUserRole() {
    //     SignupRequest request = new SignupRequest();
    //     request.setUsername("testuser");
    //     request.setPassword("password");
    //     request.setFirstName("Test");
    //     request.setLastName("User");
    //     request.setEmail("test@example.com");
    //     request.setAuthority("user");
    
    //     Authorities userRole = new Authorities();
    //     userRole.setAuthority("USER");
    
    //     when(authoritiesService.findByAuthority("USER")).thenReturn(userRole);
    //     when(encoder.encode(any(String.class))).thenReturn("encodedPassword");
    
    //     authService.createUser(request);
    
    //     verify(authoritiesService, times(1)).findByAuthority("USER");
    //     verify(userService, times(1)).saveUser(any(User.class));
    // }

@Test
void testCreateUsername() {
    when(userService.existsUser(any(String.class))).thenReturn(false);

    String username = authService.createUsername("Test", "User");

    assertEquals("testuser", username);
}


@Test
void testCreateUsernameWithShortNames() {
    when(userService.existsUser(any(String.class))).thenReturn(false);

    String username = authService.createUsername("Te", "Us");

    assertEquals("teus", username);
}
@Test
void testQuitarTildes() throws Exception {
    Method quitarTildesMethod = AuthService.class.getDeclaredMethod("quitarTildes", String.class);
    quitarTildesMethod.setAccessible(true);

    String result = (String) quitarTildesMethod.invoke(authService, "áéíóúÁÉÍÓÚ");

    assertEquals("aeiouaeiou", result);
}
}
