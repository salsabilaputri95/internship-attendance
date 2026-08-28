package model

import (
	"time"

	"github.com/google/uuid"
)

type AttendanceStatus string

const (
	StatusHadir      AttendanceStatus = "HADIR"
	StatusTerlambat  AttendanceStatus = "TERLAMBAT"
	StatusIzin       AttendanceStatus = "IZIN"
	StatusAlpha      AttendanceStatus = "ALPHA"
	StatusBelumHadir AttendanceStatus = "BELUM_HADIR"
)

type Attendance struct {
	ID                 uuid.UUID        `json:"id"`
	InternID           uuid.UUID        `json:"intern_id"`
	AttendanceDate     string           `json:"attendance_date"` // YYYY-MM-DD
	CheckIn            *time.Time       `json:"check_in,omitempty"`
	CheckInLatitude    *float64         `json:"check_in_latitude,omitempty"`
	CheckInLongitude   *float64         `json:"check_in_longitude,omitempty"`
	CheckInAccuracy    *float64         `json:"check_in_accuracy,omitempty"`
	CheckInDistance    *float64         `json:"check_in_distance,omitempty"`
	CheckInPhotoURL    *string          `json:"check_in_photo_url,omitempty"`
	CheckOut           *time.Time       `json:"check_out,omitempty"`
	CheckOutLatitude   *float64         `json:"check_out_latitude,omitempty"`
	CheckOutLongitude  *float64         `json:"check_out_longitude,omitempty"`
	CheckOutAccuracy   *float64         `json:"check_out_accuracy,omitempty"`
	CheckOutDistance   *float64         `json:"check_out_distance,omitempty"`
	CheckOutPhotoURL   *string          `json:"check_out_photo_url,omitempty"`
	Status             AttendanceStatus `json:"status"`
	Notes              *string          `json:"notes,omitempty"`
	CreatedAt          time.Time        `json:"created_at"`
	UpdatedAt          time.Time        `json:"updated_at"`
}

type AttendanceDetailResponse struct {
	Attendance
	InternName       string `json:"intern_name"`
	InternUniversity string `json:"intern_university"`
	InternMajor      string `json:"intern_major"`
}
