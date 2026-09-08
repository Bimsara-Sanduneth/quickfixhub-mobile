package com.quickfixhub.backend.review;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;
import java.util.List;

// Stores a small fixed-vocabulary tag list (see 2p's quick-select chips) as one comma-joined
// column rather than a join table - there's no need to query "reviews with tag X" anywhere yet,
// so a normalized table would be pure overhead.
@Converter
public class TagsConverter implements AttributeConverter<List<String>, String> {

	@Override
	public String convertToDatabaseColumn(List<String> attribute) {
		if (attribute == null || attribute.isEmpty()) {
			return null;
		}
		return String.join(",", attribute);
	}

	@Override
	public List<String> convertToEntityAttribute(String dbData) {
		if (dbData == null || dbData.isBlank()) {
			return List.of();
		}
		return Arrays.asList(dbData.split(","));
	}
}
