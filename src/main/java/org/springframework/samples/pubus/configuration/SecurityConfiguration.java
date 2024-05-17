package org.springframework.samples.pubus.configuration;

import static org.springframework.security.config.Customizer.withDefaults;
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.annotation.Order;
//import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.oauth2.client.web.OAuth2LoginAuthenticationFilter;
// import org.springframework.security.oauth2.client.web.OAuth2LoginAuthenticationProvider;
// import org.springframework.security.oauth2.client.web.OAuth2LoginConfigurer;
// import org.springframework.security.oauth2.client.web.OAuth2LoginConfigurer.AuthorizationEndpointConfig;
// import org.springframework.security.oauth2.client.web.OAuth2LoginConfigurer.RedirectUriConfigurer;
import org.springframework.security.oauth2.core.user.OAuth2User;


@Configuration
@Order(2)
public class SecurityConfiguration {

	@Autowired
	DataSource dataSource;

    private final ClientRegistrationRepository clientRegistrationRepository;
    private final OAuth2AuthorizedClientRepository authorizedClientRepository;

    public SecurityConfiguration(ClientRegistrationRepository clientRegistrationRepository,
        OAuth2AuthorizedClientRepository authorizedClientRepository) {
        this.clientRegistrationRepository = clientRegistrationRepository;
        this.authorizedClientRepository = authorizedClientRepository;
    }

    @SuppressWarnings({ "removal", "deprecation" })
	@Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .addFilterBefore(oAuth2AuthorizationRequestRedirectFilter(), OAuth2LoginAuthenticationFilter.class)
            .oauth2Login(oauth2 -> {
                oauth2
                    .authorizationEndpoint(authorizationEndpoint -> {
                        authorizationEndpoint.baseUri("/oauth2/authorize-client");
                    })
                    .redirectionEndpoint(redirectionEndpoint -> {
                        redirectionEndpoint.baseUri("/oauth2/callback/*");
                    })
                    .clientRegistrationRepository(clientRegistrationRepository)
                    .authorizedClientRepository(authorizedClientRepository);
            })
			.cors(withDefaults())		
			.csrf(AbstractHttpConfigurer::disable)
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))			
			.headers((headers) -> headers.frameOptions((frameOptions) -> frameOptions.disable()));
            
        return http.build();
    }


	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception{
		return config.getAuthenticationManager();
	}	

	@Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

	@Bean
    public OAuth2AuthorizationRequestRedirectFilter oAuth2AuthorizationRequestRedirectFilter() {
        return new OAuth2AuthorizationRequestRedirectFilter(clientRegistrationRepository);
    }
}

