package org.springframework.samples.pubus.configuration;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;


@DataJpaTest
public class testDatabaseConnection {
    @Autowired
    private DataSource dataSource;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void testDatabaseConnection() throws SQLException {
        // Verifica que el datasource no sea nulo
        assertNotNull(dataSource);
        
        // Intenta obtener una conexión
        try (Connection connection = dataSource.getConnection()) {
            assertTrue(connection.isValid(1000));
            System.out.println("Conexión a la base de datos establecida correctamente");
            
            // Imprimir información de la base de datos
            DatabaseMetaData metaData = connection.getMetaData();
            System.out.println("URL de la base de datos: " + metaData.getURL());
            System.out.println("Nombre del producto: " + metaData.getDatabaseProductName());
            System.out.println("Versión del producto: " + metaData.getDatabaseProductVersion());
        }
        
        // Ejecuta una consulta simple
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        
        System.out.println("Número de usuarios en la base de datos: " + count);
    }
}
