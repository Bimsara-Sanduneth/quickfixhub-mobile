package com.quickfixhub.backend.provider.dto;

import java.util.List;

public record AvailabilityResponse(Integer serviceRadiusKm, List<AvailabilityDayResponse> days) {
}
