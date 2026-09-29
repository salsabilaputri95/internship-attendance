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
	StatusSakit      AttendanceStatus = "SAKIT"
	StatusAlpha      AttendanceStatus = "ALPHA"
	StatusBelumHadir AttendanceStatus = "BELUM_HADIR"
)

type Attendance struct {
	ID                 uuid.UUID        `json:"id"`
	UserID             *uuid.UUID       `json:"user_id,omitempty"`
	InternID           *uuid.UUID       `json:"intern_id,omitempty"`
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

type AdminAttendanceItem struct {
	ID                 uuid.UUID        `json:"id"`
	UserID             uuid.UUID        `json:"user_id"`
	InternID           *uuid.UUID       `json:"intern_id,omitempty"`
	UserName           string           `json:"user_name"`
	UserEmail          string           `json:"user_email"`
	UserRole           string           `json:"user_role"` // "intern" | "mentor"
	Category           string           `json:"category"`  // "Peserta Magang" | "Mentor"
	University         string           `json:"university,omitempty"`
	Major              string           `json:"major,omitempty"`
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

type AdminDashboardStats struct {
	TotalAttendance int `json:"total_attendance"`
	TotalHadir      int `json:"total_hadir"`
	TotalTerlambat  int `json:"total_terlambat"`
	TotalIzin       int `json:"total_izin"`
	TotalSakit      int `json:"total_sakit"`
	TotalAlpha      int `json:"total_alpha"`
	TotalBelumHadir int `json:"total_belum_hadir"`
	TotalInterns    int `json:"total_interns"`
	TotalMentors    int `json:"total_mentors"`
	AttendanceRate  float64 `json:"attendance_rate"`
}

type AdminUserListItem struct {
	ID         uuid.UUID `json:"id"`
	UserID     uuid.UUID `json:"user_id"`
	InternID   *uuid.UUID `json:"intern_id,omitempty"`
	Name       string    `json:"name"`
	Email      string    `json:"email"`
	Role       string    `json:"role"` // "intern" or "mentor"
	Category   string    `json:"category"`
	University string    `json:"university,omitempty"`
	Major      string    `json:"major,omitempty"`
}

type AdminCreateAttendanceRequest struct {
	UserID         uuid.UUID `json:"user_id"`
	AttendanceDate string    `json:"attendance_date"` // YYYY-MM-DD
	CheckInTime    *string   `json:"check_in_time,omitempty"` // HH:MM or HH:MM:SS or full ISO
	CheckOutTime   *string   `json:"check_out_time,omitempty"`
	DistanceIn     *float64  `json:"distance_in,omitempty"`
	DistanceOut    *float64  `json:"distance_out,omitempty"`
	Status         string    `json:"status"` // HADIR, TERLAMBAT, IZIN, SAKIT, ALPHA
	Notes          *string   `json:"notes,omitempty"`
}

type AdminUpdateAttendanceRequest struct {
	AttendanceDate *string  `json:"attendance_date,omitempty"`
	CheckInTime    *string  `json:"check_in_time,omitempty"`
	CheckOutTime   *string  `json:"check_out_time,omitempty"`
	DistanceIn     *float64 `json:"distance_in,omitempty"`
	DistanceOut    *float64 `json:"distance_out,omitempty"`
	Status         string   `json:"status"`
	Notes          *string  `json:"notes,omitempty"`
	Reason         string   `json:"reason"` // Audit log reason
}

