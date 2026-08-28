package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type AttendanceCorrection struct {
	ID           uuid.UUID       `json:"id"`
	AttendanceID uuid.UUID       `json:"attendance_id"`
	CorrectedBy  uuid.UUID       `json:"corrected_by"`
	OldValue     json.RawMessage `json:"old_value"`
	NewValue     json.RawMessage `json:"new_value"`
	Reason       string          `json:"reason"`
	CreatedAt    time.Time       `json:"created_at"`
}

type AttendanceCorrectionWithUser struct {
	AttendanceCorrection
	MentorName  string `json:"mentor_name"`
	MentorEmail string `json:"mentor_email"`
}
