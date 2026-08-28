package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"bps-attendance-backend/internal/model"
	"bps-attendance-backend/internal/repository"
)

type CorrectionRequest struct {
	CheckIn  *string                `json:"check_in,omitempty"`  // ISO RFC3339 string
	CheckOut *string                `json:"check_out,omitempty"` // ISO RFC3339 string
	Status   model.AttendanceStatus `json:"status"`
	Notes    *string                `json:"notes,omitempty"`
	Reason   string                 `json:"reason"`
}

type MentorDashboardResponse struct {
	Date           string                           `json:"date"`
	Stats          *repository.TodayStats           `json:"stats"`
	OfficeLocation *model.Location                  `json:"office_location"`
	Attendances    []model.AttendanceDetailResponse `json:"attendances"`
}

type AttendanceDetailWithLogs struct {
	model.AttendanceDetailResponse
	Corrections []model.AttendanceCorrectionWithUser `json:"corrections"`
}

type MentorService interface {
	GetDashboard(ctx context.Context, dateStr string) (*MentorDashboardResponse, error)
	GetAttendanceList(ctx context.Context, dateStr, search, status string) ([]model.AttendanceDetailResponse, error)
	GetAttendanceDetailWithLogs(ctx context.Context, attendanceID uuid.UUID) (*AttendanceDetailWithLogs, error)
	CorrectAttendance(ctx context.Context, attendanceID uuid.UUID, mentorID uuid.UUID, req *CorrectionRequest) (*model.Attendance, error)
	GetInterns(ctx context.Context, status string) ([]model.InternWithUser, error)
}

type mentorService struct {
	attRepo    repository.AttendanceRepository
	locRepo    repository.LocationRepository
	internRepo repository.InternRepository
	userRepo   repository.UserRepository
}

func NewMentorService(
	attRepo repository.AttendanceRepository,
	locRepo repository.LocationRepository,
	internRepo repository.InternRepository,
	userRepo repository.UserRepository,
) MentorService {
	return &mentorService{
		attRepo:    attRepo,
		locRepo:    locRepo,
		internRepo: internRepo,
		userRepo:   userRepo,
	}
}

func (s *mentorService) GetDashboard(ctx context.Context, dateStr string) (*MentorDashboardResponse, error) {
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	stats, err := s.attRepo.GetTodayStats(ctx, dateStr)
	if err != nil {
		return nil, fmt.Errorf("failed to get dashboard stats: %w", err)
	}

	officeLoc, err := s.locRepo.GetActiveLocation(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get office location: %w", err)
	}

	attendances, err := s.attRepo.GetTodayAllAttendance(ctx, dateStr, "", "")
	if err != nil {
		return nil, fmt.Errorf("failed to get attendances: %w", err)
	}

	return &MentorDashboardResponse{
		Date:           dateStr,
		Stats:          stats,
		OfficeLocation: officeLoc,
		Attendances:    attendances,
	}, nil
}

func (s *mentorService) GetAttendanceList(ctx context.Context, dateStr, search, status string) ([]model.AttendanceDetailResponse, error) {
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	return s.attRepo.GetTodayAllAttendance(ctx, dateStr, search, status)
}

func (s *mentorService) GetAttendanceDetailWithLogs(ctx context.Context, attendanceID uuid.UUID) (*AttendanceDetailWithLogs, error) {
	detail, err := s.attRepo.GetDetailByID(ctx, attendanceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get attendance detail: %w", err)
	}
	if detail == nil {
		return nil, errors.New("data absensi tidak ditemukan")
	}

	corrections, err := s.attRepo.GetCorrectionsByAttendanceID(ctx, attendanceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get correction logs: %w", err)
	}

	return &AttendanceDetailWithLogs{
		AttendanceDetailResponse: *detail,
		Corrections:              corrections,
	}, nil
}

func (s *mentorService) CorrectAttendance(ctx context.Context, attendanceID uuid.UUID, mentorID uuid.UUID, req *CorrectionRequest) (*model.Attendance, error) {
	if req.Reason == "" {
		return nil, errors.New("alasan koreksi (reason) wajib diisi untuk rekam audit log")
	}

	// 1. Fetch current attendance record
	existing, err := s.attRepo.GetByID(ctx, attendanceID)
	if err != nil {
		return nil, fmt.Errorf("error fetching attendance: %w", err)
	}
	if existing == nil {
		return nil, errors.New("data presensi tidak ditemukan")
	}

	// 2. Prepare oldValue JSON snapshot
	oldValueBytes, err := json.Marshal(map[string]interface{}{
		"check_in":  existing.CheckIn,
		"check_out": existing.CheckOut,
		"status":    existing.Status,
		"notes":     existing.Notes,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to serialize old value: %w", err)
	}

	// 3. Apply updates
	if req.Status != "" {
		existing.Status = req.Status
	}
	if req.Notes != nil {
		existing.Notes = req.Notes
	}

	if req.CheckIn != nil && *req.CheckIn != "" {
		parsedCheckIn, err := time.Parse(time.RFC3339, *req.CheckIn)
		if err == nil {
			existing.CheckIn = &parsedCheckIn
		}
	}

	if req.CheckOut != nil && *req.CheckOut != "" {
		parsedCheckOut, err := time.Parse(time.RFC3339, *req.CheckOut)
		if err == nil {
			existing.CheckOut = &parsedCheckOut
		}
	}

	// 4. Prepare newValue JSON snapshot
	newValueBytes, err := json.Marshal(map[string]interface{}{
		"check_in":  existing.CheckIn,
		"check_out": existing.CheckOut,
		"status":    existing.Status,
		"notes":     existing.Notes,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to serialize new value: %w", err)
	}

	// 5. Update attendance table
	if err := s.attRepo.UpdateAttendanceByCorrection(ctx, existing); err != nil {
		return nil, fmt.Errorf("failed to update attendance record: %w", err)
	}

	// 6. Record Audit Log in attendance_corrections
	correction := &model.AttendanceCorrection{
		ID:           uuid.New(),
		AttendanceID: existing.ID,
		CorrectedBy:  mentorID,
		OldValue:     oldValueBytes,
		NewValue:     newValueBytes,
		Reason:       req.Reason,
	}

	if err := s.attRepo.CreateCorrection(ctx, correction); err != nil {
		return nil, fmt.Errorf("failed to create correction audit log: %w", err)
	}

	return existing, nil
}

func (s *mentorService) GetInterns(ctx context.Context, status string) ([]model.InternWithUser, error) {
	return s.internRepo.ListAllInterns(ctx, status)
}
