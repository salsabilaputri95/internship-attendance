package model

import (
	"time"

	"github.com/google/uuid"
)

type Location struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Radius    float64   `json:"radius"` // In meters
	Status    string    `json:"status"` // 'active', 'inactive'
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
