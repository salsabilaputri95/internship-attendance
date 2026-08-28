package utils

import "math"

const (
	// EarthRadiusMeters is the approximate radius of the Earth in meters
	EarthRadiusMeters = 6371000.0
)

// CalculateHaversineDistance returns the great-circle distance between two GPS coordinates in meters
func CalculateHaversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	// Convert degrees to radians
	dLat := (lat2 - lat1) * (math.Pi / 180.0)
	dLon := (lon2 - lon1) * (math.Pi / 180.0)

	lat1Rad := lat1 * (math.Pi / 180.0)
	lat2Rad := lat2 * (math.Pi / 180.0)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Sin(dLon/2)*math.Sin(dLon/2)*math.Cos(lat1Rad)*math.Cos(lat2Rad)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	distance := EarthRadiusMeters * c
	return math.Round(distance*100) / 100 // rounded to 2 decimal places
}

// IsWithinRadius checks whether distance is within the allowed office radius (in meters)
func IsWithinRadius(distance, radius float64) bool {
	return distance <= radius
}
