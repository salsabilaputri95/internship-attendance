package model

import (
	"time"

	"github.com/google/uuid"
)

type Role string

const (
	RoleMentor Role = "mentor"
	RoleIntern Role = "intern"
	RoleAdmin  Role = "admin"
)

type User struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         Role      `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type UserProfileResponse struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      Role      `json:"role"`
	InternID  *uuid.UUID `json:"intern_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}
