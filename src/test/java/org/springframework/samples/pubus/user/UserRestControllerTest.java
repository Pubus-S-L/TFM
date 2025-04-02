package org.springframework.samples.pubus.user;

import java.util.ArrayList;
import java.util.Collections;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.pubus.auth.AuthService;
import org.springframework.samples.pubus.auth.payload.response.MessageResponse;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockitoAnnotations;
import org.springframework.samples.pubus.exceptions.AccessDeniedException;
import org.springframework.samples.pubus.paper.PaperService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@AutoConfigureTestDatabase
public class UserRestControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private AuthoritiesService authoritiesService;

    @Mock
    private AuthService authService;

    @Mock
    private PasswordEncoder encoderMock;

    @Mock
    private PaperService paperService;

    @InjectMocks
    private UserRestController userRestController;

    @BeforeEach
    public void setup(WebApplicationContext webApplicationContext) {
        MockitoAnnotations.openMocks(this);
        
    }

    @Test
    void testFindAllUsers() {
        // Configuración del mock
        List<User> users = new ArrayList<>();
        users.add(new User());
        users.add(new User());
        when(userService.findAll()).thenReturn(users);

        userRestController = new UserRestController(userService, authoritiesService, encoderMock, paperService);

        // Ejecución del método bajo prueba
        ResponseEntity<List<User>> response = userRestController.findAll(null);

        // Verificación
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(users, response.getBody());
    }

    // Tests para los demás métodos...

    @Test
    void testDeleteUser_Success() {
        // Configuración del mock
        int userId = 1;
        User currentUser = new User();
        currentUser.setId(2);
        when(userService.findUser(userId)).thenReturn(currentUser);
        when(userService.findCurrentUser()).thenReturn(currentUser);
        userRestController = new UserRestController(userService, authoritiesService, encoderMock, paperService);

        // Ejecución del método bajo prueba
        ResponseEntity<MessageResponse> response = userRestController.delete(userId);

        // Verificación
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("User deleted!", response.getBody().getMessage());
    }

    @Test
    void testDeleteUser_AccessDenied() {
        // Configuración del mock
        int userId = 1;
        User currentUser = new User();
        currentUser.setId(userId);
        when(userService.findUser(userId)).thenReturn(new User());
        when(userService.findCurrentUser()).thenReturn(currentUser);
        userRestController = new UserRestController(userService, authoritiesService, encoderMock, paperService);

        // Ejecución y verificación
        assertThrows(AccessDeniedException.class, () -> {
            userRestController.delete(userId);
        });
    }

    @Test
    void testFindAll_NoAuthParam_ReturnsAllUsers() {
        // Arrange
        List<User> users = new ArrayList<>();
        users.add(new User());
        users.add(new User());
        when(userService.findAll()).thenReturn(users);
        userRestController = new UserRestController(userService, authoritiesService, encoderMock, paperService);

        // Act
        ResponseEntity<List<User>> response = userRestController.findAll(null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(users, response.getBody());
    }

    @Test
    void testFindAll_WithAuthParam_ReturnsUsersWithAuthority() {
        // Arrange
        String authority = "ROLE_ADMIN";
        List<User> users = new ArrayList<>();
        users.add(new User());
        users.add(new User());
        when(userService.findAllByAuthority(authority)).thenReturn(users);
        userRestController = new UserRestController(userService, authoritiesService, encoderMock, paperService);

        // Act
        ResponseEntity<List<User>> response = userRestController.findAll(authority);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(users, response.getBody());
    }

    @Test
    public void testFindAllAuths_Success() {
    List<Authorities> authorities = new ArrayList<>();
    Authorities auth1 = new Authorities();
    auth1.setAuthority("USER");
    Authorities auth2 = new Authorities();
    auth2.setAuthority("ADMIN");

    when(authoritiesService.findAll()).thenReturn(authorities);
    userRestController = new UserRestController(userService, authoritiesService, encoderMock, paperService);

    ResponseEntity<List<Authorities>> response = userRestController.findAllAuths();

    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertEquals(authorities, response.getBody());
}

    @Test
    public void testFindAllAuths_EmptyList() {
        when(authoritiesService.findAll()).thenReturn(Collections.emptyList());
        userRestController = new UserRestController(userService, authoritiesService, encoderMock, paperService);
        ResponseEntity<List<Authorities>> response = userRestController.findAllAuths();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    public void testFindById_Success() {
        User user = new User();
        user.setId(1);
        user.setUsername("test_user");

        when(userService.findUser(1)).thenReturn(user);
        userRestController = new UserRestController(userService, authoritiesService, encoderMock, paperService);
        ResponseEntity<User> response = userRestController.findById(1);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(user, response.getBody());
    }

    // @Test
    // public void testCreate_Success() {
    //     User user = new User();
    //     user.setUsername("new_user");
    //     user.setPassword("password");
    //     user.setFirstName("Nombre Test");
    //     user.setLastName("Apellido Test");
    //     user.setUsername("test");
    //     user.setStudies("ingeniería");
    //     user.setJob("estudiante");
    //     user.setEmail("test@gmail.com");

    //     when(userService.saveUser(user)).thenReturn(user);
    //     userRestController = new UserRestController(userService, authoritiesService, encoderMock);
    //     ResponseEntity<User> response = userRestController.create(user);

    //     assertEquals(HttpStatus.CREATED, response.getStatusCode());
    //     assertEquals(user, response.getBody());
    //     assertEquals(user.getFirstName(), response.getBody().getFirstName());
    //     assertEquals(user.getLastName(), response.getBody().getLastName());
    //     assertEquals(user.getUsername(), response.getBody().getUsername());
    //     assertEquals(user.getStudies(), response.getBody().getStudies());
    //     assertEquals(user.getJob(), response.getBody().getJob());
    //     assertEquals(user.getEmail(), response.getBody().getEmail());

    // }

    @Test
    public void testUpdate_Success() {
        User existingUser = new User();
        existingUser.setId(1);
        existingUser.setUsername("old_user");

        User updatedUser = new User();
        updatedUser.setId(1);
        updatedUser.setUsername("updated_user");

        when(userService.findUser(1)).thenReturn(existingUser);
        when(userService.updateUser(updatedUser, 1)).thenReturn(updatedUser);
        userRestController = new UserRestController(userService, authoritiesService, encoderMock, paperService);
        ResponseEntity<User> response = userRestController.update(1, updatedUser);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(updatedUser, response.getBody());
    }

}
