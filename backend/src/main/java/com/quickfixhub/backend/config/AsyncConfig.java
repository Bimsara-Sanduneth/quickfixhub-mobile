package com.quickfixhub.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.Arrays;
import java.util.stream.Collectors;

// Enables @Async, currently used only by EmailService so sending mail never blocks (or times) a
// request thread. Uses Spring Boot's auto-configured `applicationTaskExecutor`.
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

	private static final Logger log = LoggerFactory.getLogger(AsyncConfig.class);

	@Override
	public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
		return (ex, method, params) -> log.error("Uncaught exception in async method {} with args {}",
				method.getName(), Arrays.stream(params).map(String::valueOf).collect(Collectors.joining(", ")), ex);
	}
}
