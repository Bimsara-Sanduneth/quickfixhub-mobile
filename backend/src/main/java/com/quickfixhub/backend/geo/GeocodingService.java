package com.quickfixhub.backend.geo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Optional;

// Free, no-key geocoding via OpenStreetMap's Nominatim - good enough for city-level provider
// locations in a dev-scale project. Best-effort throughout: a failure (network, no match, rate
// limit) never blocks profile creation, it just leaves latitude/longitude null.
@Component
public class GeocodingService {

	private static final Logger log = LoggerFactory.getLogger(GeocodingService.class);

	private final RestClient restClient;

	public GeocodingService() {
		SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
		requestFactory.setConnectTimeout(5_000);
		requestFactory.setReadTimeout(5_000);
		this.restClient = RestClient.builder()
				.baseUrl("https://nominatim.openstreetmap.org")
				// Required by Nominatim's usage policy - requests without an identifying
				// User-Agent are liable to be blocked.
				// https://operations.osmfoundation.org/policies/nominatim/
				.defaultHeader("User-Agent", "QuickFixHub-dev/1.0 (contact: bimsarasanduneth@gmail.com)")
				.requestFactory(requestFactory)
				.build();
	}

	public Optional<double[]> geocode(String query) {
		if (query == null || query.isBlank()) {
			return Optional.empty();
		}
		try {
			NominatimResult[] results = restClient.get()
					.uri(uriBuilder -> uriBuilder.path("/search")
							.queryParam("q", query)
							.queryParam("format", "json")
							.queryParam("limit", "1")
							.build())
					.retrieve()
					.body(NominatimResult[].class);
			if (results == null || results.length == 0) {
				return Optional.empty();
			}
			return Optional.of(new double[] { Double.parseDouble(results[0].lat()), Double.parseDouble(results[0].lon()) });
		} catch (Exception e) {
			log.warn("Geocoding failed for '{}': {}", query, e.getMessage());
			return Optional.empty();
		}
	}

	private record NominatimResult(String lat, String lon) {
	}
}
