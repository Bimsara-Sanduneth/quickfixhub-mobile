package com.quickfixhub.backend.geo;

public final class GeoUtils {

	private static final double EARTH_RADIUS_KM = 6371.0;

	private GeoUtils() {
	}

	// Great-circle distance between two lat/lng points, in kilometers. Good enough for a
	// city-level "providers within N km" filter - no need for a PostGIS extension at this scale.
	public static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
		double dLat = Math.toRadians(lat2 - lat1);
		double dLon = Math.toRadians(lon2 - lon1);
		double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
				+ Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
						* Math.sin(dLon / 2) * Math.sin(dLon / 2);
		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return EARTH_RADIUS_KM * c;
	}
}
