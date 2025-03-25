// package org.springframework.samples.pubus.user;

// import static org.junit.Assert.*;

// import java.util.Arrays;
// import java.util.List;
// import java.util.Optional;
// import org.apache.tomcat.util.net.openssl.ciphers.Authentication;
// import org.junit.jupiter.api.BeforeEach;
// import org.junit.jupiter.api.Test;
// import org.mockito.InjectMocks;
// import org.mockito.Mock;
// import org.mockito.MockitoAnnotations;
// import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
// import org.springframework.boot.test.context.SpringBootTest;
// import org.springframework.samples.pubus.exceptions.ResourceNotFoundException;
// import org.springframework.security.core.context.SecurityContext;
// import static org.mockito.ArgumentMatchers.any;
// import static org.mockito.Mockito.doNothing;
// import static org.mockito.Mockito.times;
// import static org.mockito.Mockito.verify;
// import static org.mockito.Mockito.when;

// @SpringBootTest
// @AutoConfigureTestDatabase
// public class UserServiceTest {

//     @Mock
//     private UserRepository userRepository;

//     @Mock
//     private Authentication authentication;

//     @Mock
//     private SecurityContext securityContext;

//     @InjectMocks
//     private UserService userService;

//     @BeforeEach
//     void setUp() {
//         MockitoAnnotations.openMocks(this);
//     }


//     public User createUser(String username, String email) {
//         User user = new User();
//         user.setUsername(username);
//         user.setEmail(email);
//         return user;
//     }

//     @Test
//     //setup

//     public void findUserTest(){
//         //setup
//         User user = createUser("user","pedro@gmail.com");
//         when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        
//         //action
//         User foundUser= userService.findUser(user.email);

//         //assert
//         assertNotNull(foundUser);
//         assertEquals(user.getEmail() ,foundUser.getEmail());
        
//     }

//     @Test
//     void findUserNotFoundTest() {
//     String email = "test@example.com";
//     when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

//     assertThrows(ResourceNotFoundException.class, () -> userService.findUser(email));
// }

//     @Test
//     void saveUserTest() {
//         User user = new User();
//         when(userRepository.save(any(User.class))).thenReturn(user);

//         User savedUser = userService.saveUser(user);

//         assertNotNull(savedUser);
//         verify(userRepository, times(1)).save(user);
//     }

//     @Test
//     void testFindUserById() {
//         Integer id = 1;
//         User user = new User();
//         user.setId(id);
//         when(userRepository.findById(id)).thenReturn(Optional.of(user));
    
//         User foundUser = userService.findUser(id);
    
//         assertNotNull(foundUser);
//         assertEquals(id, foundUser.getId());
//     }
    
//     @Test
//     void testFindUserByIdNotFound() {
//         Integer id = 1;
//         when(userRepository.findById(id)).thenReturn(Optional.empty());
    
//         assertThrows(ResourceNotFoundException.class, () -> userService.findUser(id));
//     }

//     @Test
//     void testDeleteUser() {
//         Integer id = 1;
//         User user = new User();
//         user.setId(id);
//         when(userRepository.findById(id)).thenReturn(Optional.of(user));
//         doNothing().when(userRepository).delete(user);

//         userService.deleteUser(id);

//         verify(userRepository, times(1)).delete(user);
//     }

//     @Test
//     void testUpdateUser() {
//     Integer id = 1;
//     User oldUser = new User();
//     oldUser.setId(id);
//     User newUser = new User();
//     newUser.setEmail("new@example.com");
//     when(userRepository.findById(id)).thenReturn(Optional.of(oldUser));
//     when(userRepository.save(any(User.class))).thenReturn(oldUser);

//     User updatedUser = userService.updateUser(newUser, id);

//     assertNotNull(updatedUser);
//     assertEquals("new@example.com", updatedUser.getEmail());
// }

//     @Test
//     void testFindAllAuthorities_1() {
//         // Arrange
//         List<String> authorities = Arrays.asList("ROLE_USER", "ROLE_ADMIN");
//         when(userRepository.findAllAuthorities()).thenReturn(authorities);

//         // Act
//         List<String> result = userService.findAllAuthorities();

//         // Assert
//         assertEquals(authorities, result);
//     }

//     // Test for existsUser
//     @Test
//     void testExistsUser() {
//         // Arrange
//         String username = "testuser";
//         when(userRepository.existsByUsername(username)).thenReturn(true);

//         // Act
//         Boolean result = userService.existsUser(username);

//         // Assert
//         assertTrue(result);
//     }

//     // Test for findAll
//     @Test
//     void testFindAll() {
//         // Arrange
//         Iterable<User> users = Arrays.asList(new User(), new User());
//         when(userRepository.findAll()).thenReturn(users);

//         // Act
//         Iterable<User> result = userService.findAll();

//         // Assert
//         assertEquals(users, result);
//     }

//     // Test for findAllByAuthority
//     @Test
//     void testFindAllByAuthority() {
//         // Arrange
//         String authority = "ROLE_USER";
//         User user1 = new User();
//         User user2 = new User();
//         Iterable<User> users = Arrays.asList(user1, user2);
//         when(userRepository.findAllByAuthority(authority)).thenReturn(users);

//         // Act
//         Iterable<User> result = userService.findAllByAuthority(authority);

//         // Assert
//         assertEquals(users, result);
//     }

// }
