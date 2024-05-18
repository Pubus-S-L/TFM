package org.springframework.samples.pubus.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.ArrayList;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.pubus.auth.payload.response.MessageResponse;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.List;


import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.pubus.auth.payload.response.MessageResponse;
import org.springframework.samples.pubus.exceptions.AccessDeniedException;
import org.springframework.samples.pubus.user.Authorities;
import org.springframework.samples.pubus.user.AuthoritiesService;
import org.springframework.samples.pubus.user.User;
import org.springframework.samples.pubus.user.UserService;

@SpringBootTest
@AutoConfigureTestDatabase
public class UserRestControllerTest {
    @Mock
    private UserService userService;

    @Mock
    private AuthoritiesService authoritiesService;

    @InjectMocks
    private UserRestController userRestController;

    @Test
    void testFindAllUsers() {
        // Configuración del mock
        List<User> users = new ArrayList<>();
        users.add(new User());
        users.add(new User());
        when(userService.findAll()).thenReturn(users);

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
        when(userService.findUser(userId)).thenReturn(new User());
        when(userService.findCurrentUser()).thenReturn(currentUser);

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

        // Act
        ResponseEntity<List<User>> response = userRestController.findAll(authority);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(users, response.getBody());
    }

}
