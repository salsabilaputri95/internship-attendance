package utils

import (
	"testing"
)

func TestCalculateHaversineDistance(t *testing.T) {
	// BPS Jeneponto coordinates: -5.6987123, 119.7289456
	bpsLat := -5.6987123
	bpsLon := 119.7289456

	tests := []struct {
		name        string
		userLat     float64
		userLon     float64
		maxExpected float64
		minExpected float64
		within100m  bool
	}{
		{
			name:        "Same location (distance should be ~0m)",
			userLat:     bpsLat,
			userLon:     bpsLon,
			maxExpected: 1.0,
			minExpected: 0.0,
			within100m:  true,
		},
		{
			name:        "Nearby (approx 40-60 meters away)",
			userLat:     -5.6983000,
			userLon:     119.7289456,
			maxExpected: 70.0,
			minExpected: 30.0,
			within100m:  true,
		},
		{
			name:        "Far away (approx 1+ kilometer away)",
			userLat:     -5.7100000,
			userLon:     119.7350000,
			maxExpected: 2500.0,
			minExpected: 1000.0,
			within100m:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dist := CalculateHaversineDistance(bpsLat, bpsLon, tt.userLat, tt.userLon)
			if dist < tt.minExpected || dist > tt.maxExpected {
				t.Errorf("CalculateHaversineDistance() = %v, expected between %v and %v", dist, tt.minExpected, tt.maxExpected)
			}

			within := IsWithinRadius(dist, 100.0)
			if within != tt.within100m {
				t.Errorf("IsWithinRadius() = %v, expected %v", within, tt.within100m)
			}
		})
	}
}
