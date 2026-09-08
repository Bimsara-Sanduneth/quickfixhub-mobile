package com.quickfixhub.backend.provider.dto;

import com.quickfixhub.backend.provider.ProviderAvailability;

public record AvailabilityDayResponse(int dayOfWeek, boolean isOpen, String startTime, String endTime) {

	public static AvailabilityDayResponse from(ProviderAvailability availability) {
		return new AvailabilityDayResponse(
				availability.getDayOfWeek(), availability.isOpen(), availability.getStartTime(), availability.getEndTime());
	}

	// A day the provider has never saved yet - closed, no times set.
	public static AvailabilityDayResponse closed(int dayOfWeek) {
		return new AvailabilityDayResponse(dayOfWeek, false, null, null);
	}
}
