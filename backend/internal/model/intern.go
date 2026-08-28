package model

import (
	"time"

	"github.com/google/uuid"
)

type InternStatus string

const (
	InternStatusActive    InternStatus = "active"
	InternStatusCompleted InternStatus = "completed"
	InternStatusInactive  InternStatus = "inactive"
)

type Intern struct {
	ID           uuid.UUID    `json:"id"`
	UserID       uuid.UUID    `json:"user_id"`
	University   string       `json:"university"`
	Major        string       `json:"major"`
	Phone        *string      `json:"phone,omitempty"`
	SupervisorID *uuid.UUID   `json:"supervisor_id,omitempty"`
	StartDate    string       `json:"start_date"` // YYYY-MM-DD
	EndDate      string       `json:"end_date"`   // YYYY-MM-DD
	Status       InternStatus `json:"status"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
}

type InternWithUser struct {
	ID             uuid.UUID    `json:"id"`
	UserID         uuid.UUID    `json:"user_id"`
	Name           string       `json:"name"`
	Email          string       `json:"email"`
	University     string       `json:"university"`
	Major          string       `json:"major"`
	Phone          *string      `json:"phone,omitempty"`
	SupervisorID   *uuid.UUID   `json:"supervisor_id,omitempty"`
	SupervisorName *string      `json:"supervisor_name,omitempty"`
	StartDate      string       `json:"start_date"`
	EndDate        string       `json:"end_date"`
	Status         InternStatus `json:"status"`
}
