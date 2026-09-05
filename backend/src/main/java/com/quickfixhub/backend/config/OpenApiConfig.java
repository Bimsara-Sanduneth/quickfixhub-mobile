package com.quickfixhub.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

	@Bean
	public OpenAPI quickFixHubOpenApi() {
		return new OpenAPI()
				.info(new Info()
						.title("QuickFixHub API")
						.description("QuickFixHub backend API")
						.version("v0"));
	}
}
