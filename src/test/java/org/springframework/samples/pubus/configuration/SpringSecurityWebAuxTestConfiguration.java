package org.springframework.samples.pubus.configuration;

import java.util.Arrays;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

@TestConfiguration
public class SpringSecurityWebAuxTestConfiguration {

    @Bean
    @Primary
    public UserDetailsService userDetailsService() {
        User activeUser = new User("owner", "password",Arrays.asList(
            new SimpleGrantedAuthority("USER")));


        return new InMemoryUserDetailsManager(Arrays.asList(
        		activeUser
        ));
    }
}
