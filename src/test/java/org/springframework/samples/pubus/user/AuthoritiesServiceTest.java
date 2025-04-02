package org.springframework.samples.pubus.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import java.util.ArrayList;
import java.util.List;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.samples.pubus.exceptions.ResourceNotFoundException;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@AutoConfigureTestDatabase
public class AuthoritiesServiceTest {
    @Mock
    private AuthoritiesRepository authoritiesRepository;

    @InjectMocks
    private AuthoritiesService authoritiesService;

    @Test
    void testFindAllAuthorities() {
        // Configuración del mock
        List<Authorities> authoritiesList = new ArrayList<>();
        authoritiesList.add(new Authorities());
        authoritiesList.add(new Authorities());
        when(authoritiesRepository.findAll()).thenReturn(authoritiesList);

        // Ejecución del método bajo prueba
        Iterable<Authorities> result = authoritiesService.findAll();

        // Verificación
        assertNotNull(result);
        assertTrue(result.iterator().hasNext());
        assertEquals(2, ((List<Authorities>) result).size());
    }

    @Test
    void testFindByAuthority() {
        // Configuración del mock
        Authorities authority = new Authorities();
        authority.setAuthority("ROLE_ADMIN");
        when(authoritiesRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(authority));

        // Ejecución del método bajo prueba
        Authorities result = authoritiesService.findByAuthority("ROLE_ADMIN");

        // Verificación
        assertNotNull(result);
        assertEquals("ROLE_ADMIN", result.getAuthority());
    }

    @Test
    void testFindByAuthority_InvalidAuthority() {
        // Configuración del mock
        when(authoritiesRepository.findByName("ROLE_INVALID")).thenReturn(Optional.empty());

        // Ejecución y verificación
        assertThrows(ResourceNotFoundException.class, () -> {
            authoritiesService.findByAuthority("ROLE_INVALID");
        });
    }

    @Test
    void testSaveAuthorities() {
        // Configuración del mock
        Authorities authority = new Authorities();
        authority.setAuthority("ROLE_USER");

        // Ejecución del método bajo prueba
        authoritiesService.saveAuthorities(authority);

        // Verificación
        verify(authoritiesRepository, times(1)).save(authority);
    }
}
