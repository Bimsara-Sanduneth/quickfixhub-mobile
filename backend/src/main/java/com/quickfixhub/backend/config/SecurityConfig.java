package com.quickfixhub.backend.config;

import com.quickfixhub.backend.auth.JwtAuthenticationFilter;
import com.quickfixhub.backend.exception.RestAccessDeniedHandler;
import com.quickfixhub.backend.exception.RestAuthenticationEntryPoint;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

	private static final String[] PUBLIC_PATHS = {
			"/auth/**",
			"/actuator/health",
			"/actuator/health/**",
			"/v3/api-docs/**",
			"/swagger-ui/**",
			"/swagger-ui.html"
	};

	// Read-only catalog browsing is public; write access to these paths (if ever added) is not.
	private static final String[] PUBLIC_GET_PATHS = {
			"/categories",
			"/categories/**",
			"/services",
			"/services/**",
			"/providers",
			"/providers/**"
	};

	private final JwtAuthenticationFilter jwtAuthenticationFilter;
	private final RestAuthenticationEntryPoint authenticationEntryPoint;
	private final RestAccessDeniedHandler accessDeniedHandler;

	public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
			RestAuthenticationEntryPoint authenticationEntryPoint,
			RestAccessDeniedHandler accessDeniedHandler) {
		this.jwtAuthenticationFilter = jwtAuthenticationFilter;
		this.authenticationEntryPoint = authenticationEntryPoint;
		this.accessDeniedHandler = accessDeniedHandler;
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	// Auth is stateless Bearer-token based (no cookies), so there's no session to leak via a
	// permissive CORS policy - allowCredentials stays false, which is what lets an origin
	// pattern this broad be safe. Needed because the Expo web preview (localhost:8081 or a LAN
	// IP for on-device testing) is a different origin from this API by browser rules even when
	// it's the same machine; without this, the browser silently blocks every request before the
	// app's JS ever sees a response - it doesn't surface as a proper HTTP error. Scope this down
	// to known origins before any real deployment.
	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*", "http://192.168.*.*:*"));
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("*"));
		configuration.setAllowCredentials(false);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				.cors(cors -> cors.configurationSource(corsConfigurationSource()))
				.csrf(csrf -> csrf.disable())
				.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(PUBLIC_PATHS).permitAll()
						.requestMatchers(HttpMethod.GET, PUBLIC_GET_PATHS).permitAll()
						.anyRequest().authenticated())
				.exceptionHandling(ex -> ex
						.authenticationEntryPoint(authenticationEntryPoint)
						.accessDeniedHandler(accessDeniedHandler))
				.httpBasic(httpBasic -> httpBasic.disable())
				.formLogin(formLogin -> formLogin.disable())
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}
}
