package com.eventlab.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain (HttpSecurity http){
        return http
                /**
                 * Dice a Spring Security di gestire il CORS, cioè di lasciare passare
                 * le richieste preflight (OPTIONS) e di aggiungere gli
                 * header Access-Control-Allow-Origin alle risposte.
                 */
                .cors(Customizer.withDefaults())
                /**
                 * CSRF è una protezione pensata per le applicazioni web con sessione e form,
                 * dove il browser invia automaticamente i cookie. Per un’API REST che
                 * usa Basic Auth o JSON senza sessione, la protezione non serve e
                 * blocca le chiamate POST, PUT e DELETE con 403.
                 * Quindi la disattivi solo perché non usi sessioni né form HTML nel backend.
                 * Non è una scelta da fare sempre: se avessi un’app con login via cookie, andrebbe tenuta.
                 */
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(
                        auth-> auth
                                .requestMatchers(HttpMethod.OPTIONS,"/**").permitAll()
                                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                                .requestMatchers(HttpMethod.GET, "/api/events/**").permitAll()
                                .requestMatchers(HttpMethod.POST, "/api/events").hasRole("OPERATORE")
                                .requestMatchers(HttpMethod.PUT, "/api/events/**").hasRole("OPERATORE")
                                .anyRequest().authenticated()
                )
                /**
                 * Attiva l’autenticazione HTTP Basic: il client manda username e password
                 * nell’header Authorization, e Spring li verifica con il UserDetailsService
                 * che hai definito. È il meccanismo che la guida chiede per l’operatore.
                 * Con withDefaults() usa le impostazioni standard, cioè risponde
                 * 401 se mancano le credenziali (in Postman scegli la scheda Authorization → Basic Auth, o curl -u operatore:demo1234).
                 */
                .httpBasic(Customizer.withDefaults())
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfiguration(){
        CorsConfiguration configuration=new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET","PSOT","PUT","DELETE","OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source=new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**",configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }


    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder encoder,
                                                 @Value("${app.operator.username}") String username,
                                                 @Value("${app.operator.password}") String password) {
        UserDetails operatore = User.withUsername(username)
                .password(encoder.encode(password))
                .roles("OPERATORE")
                .build();
        return new InMemoryUserDetailsManager(operatore);
    }
}
