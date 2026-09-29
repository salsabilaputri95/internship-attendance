package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"bps-attendance-backend/internal/model"
	"bps-attendance-backend/internal/repository"
)

type AdminService interface {
	GetDashboardStats(ctx context.Context) (*model.AdminDashboardStats, error)
	GetAllAttendance(ctx context.Context, search, dateStr, startDate, endDate, status, category string, page, limit int) (map[string]interface{}, error)
	GetAttendanceDetail(ctx context.Context, id uuid.UUID) (map[string]interface{}, error)
	CreateAttendance(ctx context.Context, req *model.AdminCreateAttendanceRequest) (*model.AdminAttendanceItem, error)
	UpdateAttendance(ctx context.Context, id uuid.UUID, adminID uuid.UUID, req *model.AdminUpdateAttendanceRequest) (*model.AdminAttendanceItem, error)
	DeleteAttendance(ctx context.Context, id uuid.UUID) error
	GetUsersList(ctx context.Context) ([]model.AdminUserListItem, error)
}

type adminService struct {
	adminRepo repository.AdminRepository
	userRepo  repository.UserRepository
	locRepo   repository.LocationRepository
}

func NewAdminService(adminRepo repository.AdminRepository, userRepo repository.UserRepository, locRepo repository.LocationRepository) AdminService {
	return &adminService{
		adminRepo: adminRepo,
		userRepo:  userRepo,
		locRepo:   locRepo,
	}
}

func (s *adminService) GetDashboardStats(ctx context.Context) (*model.AdminDashboardStats, error) {
	return s.adminRepo.GetDashboardStats(ctx)
}

func (s *adminService) GetAllAttendance(ctx context.Context, search, dateStr, startDate, endDate, status, category string, page, limit int) (map[string]interface{}, error) {
	if limit <= 0 {
		limit = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	items, totalRows, err := s.adminRepo.GetAllAttendance(ctx, search, dateStr, startDate, endDate, status, category, limit, offset)
	if err != nil {
		return nil, err
	}

	totalPages := (totalRows + limit - 1) / limit
	if totalPages == 0 {
		totalPages = 1
	}

	return map[string]interface{}{
		"items":        items,
		"total_rows":   totalRows,
		"page":         page,
		"limit":        limit,
		"total_pages":  totalPages,
	}, nil
}

func (s *adminService) GetAttendanceDetail(ctx context.Context, id uuid.UUID) (map[string]interface{}, error) {
	att, err := s.adminRepo.GetAttendanceByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if att == nil {
		return nil, errors.New("data absensi tidak ditemukan")
	}

	corrections, _ := s.adminRepo.GetCorrectionsByAttendanceID(ctx, id)

	return map[string]interface{}{
		"attendance":  att,
		"corrections": corrections,
	}, nil
}

func (s *adminService) CreateAttendance(ctx context.Context, req *model.AdminCreateAttendanceRequest) (*model.AdminAttendanceItem, error) {
	if req.UserID == uuid.Nil {
		return nil, errors.New("pengguna (user_id) wajib dipilih")
	}
	if strings.TrimSpace(req.AttendanceDate) == "" {
		return nil, errors.New("tanggal absensi wajib diisi")
	}

	// Validate status
	statusUpper := strings.ToUpper(strings.TrimSpace(req.Status))
	if statusUpper == "" {
		statusUpper = string(model.StatusHadir)
	}
	validStatuses := map[string]bool{
		string(model.StatusHadir):      true,
		string(model.StatusTerlambat):  true,
		string(model.StatusIzin):       true,
		string(model.StatusSakit):      true,
		string(model.StatusAlpha):      true,
		string(model.StatusBelumHadir): true,
	}
	if !validStatuses[statusUpper] {
		return nil, fmt.Errorf("status '%s' tidak valid. Gunakan HADIR, TERLAMBAT, IZIN, SAKIT, atau ALPHA", req.Status)
	}

	// Default office location coordinates
	defaultLat := -5.6783321
	defaultLng := 119.7498101
	loc, _ := s.locRepo.GetActiveLocation(ctx)
	if loc != nil {
		defaultLat = loc.Latitude
		defaultLng = loc.Longitude
	}

	var checkInTime *time.Time
	if req.CheckInTime != nil && strings.TrimSpace(*req.CheckInTime) != "" {
		t, err := parseTimeWithDate(req.AttendanceDate, *req.CheckInTime)
		if err == nil {
			checkInTime = &t
		}
	}

	var checkOutTime *time.Time
	if req.CheckOutTime != nil && strings.TrimSpace(*req.CheckOutTime) != "" {
		t, err := parseTimeWithDate(req.AttendanceDate, *req.CheckOutTime)
		if err == nil {
			checkOutTime = &t
		}
	}

	defaultAcc := 10.0
	distIn := 5.0
	if req.DistanceIn != nil {
		distIn = *req.DistanceIn
	}
	distOut := 5.0
	if req.DistanceOut != nil {
		distOut = *req.DistanceOut
	}

	newAtt := model.Attendance{
		ID:                 uuid.New(),
		UserID:             &req.UserID,
		AttendanceDate:     req.AttendanceDate,
		CheckIn:            checkInTime,
		CheckInLatitude:    &defaultLat,
		CheckInLongitude:   &defaultLng,
		CheckInAccuracy:    &defaultAcc,
		CheckInDistance:    &distIn,
		CheckOut:           checkOutTime,
		CheckOutLatitude:   &defaultLat,
		CheckOutLongitude:  &defaultLng,
		CheckOutAccuracy:   &defaultAcc,
		CheckOutDistance:   &distOut,
		Status:             model.AttendanceStatus(statusUpper),
		Notes:              req.Notes,
	}

	if err := s.adminRepo.CreateAttendance(ctx, &newAtt); err != nil {
		return nil, err
	}

	return s.adminRepo.GetAttendanceByID(ctx, newAtt.ID)
}

func (s *adminService) UpdateAttendance(ctx context.Context, id uuid.UUID, adminID uuid.UUID, req *model.AdminUpdateAttendanceRequest) (*model.AdminAttendanceItem, error) {
	existing, err := s.adminRepo.GetAttendanceByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, errors.New("data absensi tidak ditemukan")
	}

	// Capture old value for audit trail
	oldVal := map[string]interface{}{
		"status":             existing.Status,
		"attendance_date":    existing.AttendanceDate,
		"check_in":           existing.CheckIn,
		"check_out":          existing.CheckOut,
		"check_in_distance":  existing.CheckInDistance,
		"check_out_distance": existing.CheckOutDistance,
		"notes":              existing.Notes,
	}

	targetDate := existing.AttendanceDate
	if req.AttendanceDate != nil && strings.TrimSpace(*req.AttendanceDate) != "" {
		targetDate = strings.TrimSpace(*req.AttendanceDate)
	}

	statusUpper := strings.ToUpper(strings.TrimSpace(req.Status))
	if statusUpper == "" {
		statusUpper = string(existing.Status)
	}

	checkInTime := existing.CheckIn
	if req.CheckInTime != nil {
		if strings.TrimSpace(*req.CheckInTime) == "" {
			checkInTime = nil
		} else {
			t, err := parseTimeWithDate(targetDate, *req.CheckInTime)
			if err == nil {
				checkInTime = &t
			}
		}
	}

	checkOutTime := existing.CheckOut
	if req.CheckOutTime != nil {
		if strings.TrimSpace(*req.CheckOutTime) == "" {
			checkOutTime = nil
		} else {
			t, err := parseTimeWithDate(targetDate, *req.CheckOutTime)
			if err == nil {
				checkOutTime = &t
			}
		}
	}

	distIn := existing.CheckInDistance
	if req.DistanceIn != nil {
		distIn = req.DistanceIn
	}

	distOut := existing.CheckOutDistance
	if req.DistanceOut != nil {
		distOut = req.DistanceOut
	}

	notes := existing.Notes
	if req.Notes != nil {
		notes = req.Notes
	}

	updatedAtt := model.Attendance{
		ID:               id,
		AttendanceDate:   targetDate,
		CheckIn:          checkInTime,
		CheckInDistance:  distIn,
		CheckOut:         checkOutTime,
		CheckOutDistance: distOut,
		Status:           model.AttendanceStatus(statusUpper),
		Notes:            notes,
	}

	if err := s.adminRepo.UpdateAttendance(ctx, &updatedAtt); err != nil {
		return nil, err
	}

	// Record audit correction log
	newVal := map[string]interface{}{
		"status":             updatedAtt.Status,
		"attendance_date":    updatedAtt.AttendanceDate,
		"check_in":           updatedAtt.CheckIn,
		"check_out":          updatedAtt.CheckOut,
		"check_in_distance":  updatedAtt.CheckInDistance,
		"check_out_distance": updatedAtt.CheckOutDistance,
		"notes":              updatedAtt.Notes,
	}

	reason := strings.TrimSpace(req.Reason)
	if reason == "" {
		reason = "Diperbarui oleh Super Admin"
	}

	oldJSON, _ := json.Marshal(oldVal)
	newJSON, _ := json.Marshal(newVal)

	corr := model.AttendanceCorrection{
		ID:           uuid.New(),
		AttendanceID: id,
		CorrectedBy:  adminID,
		OldValue:     oldJSON,
		NewValue:     newJSON,
		Reason:       reason,
	}
	_ = s.adminRepo.CreateAuditCorrection(ctx, &corr)

	return s.adminRepo.GetAttendanceByID(ctx, id)
}

func (s *adminService) DeleteAttendance(ctx context.Context, id uuid.UUID) error {
	return s.adminRepo.DeleteAttendance(ctx, id)
}

func (s *adminService) GetUsersList(ctx context.Context) ([]model.AdminUserListItem, error) {
	return s.adminRepo.GetUsersList(ctx)
}

// Helper: parseTimeWithDate handles "16:00", "16:00:00", "2026-09-23 16:00:00+08", or RFC3339
func parseTimeWithDate(dateStr, timeStr string) (time.Time, error) {
	timeStr = strings.TrimSpace(timeStr)

	// Case 1: Already full RFC3339 / ISO
	if t, err := time.Parse(time.RFC3339, timeStr); err == nil {
		return t, nil
	}

	// Case 2: Full datetime string "2006-01-02 15:04:05" or with tz
	if t, err := time.Parse("2006-01-02 15:04:05-07", timeStr); err == nil {
		return t, nil
	}
	if t, err := time.Parse("2006-01-02 15:04:05", timeStr); err == nil {
		// Assume WITA (+08:00)
		loc := time.FixedZone("WITA", 8*3600)
		return time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), t.Minute(), t.Second(), 0, loc), nil
	}

	// Case 3: "15:04:05" or "15:04"
	var hour, min, sec int
	if _, err := fmt.Sscanf(timeStr, "%d:%d:%d", &hour, &min, &sec); err != nil {
		if _, err := fmt.Sscanf(timeStr, "%d:%d", &hour, &min); err != nil {
			return time.Time{}, errors.New("format jam tidak valid (gunakan format JJ:MM)")
		}
	}

	var year, month, day int
	if _, err := fmt.Sscanf(dateStr, "%d-%d-%d", &year, &month, &day); err != nil {
		return time.Time{}, errors.New("format tanggal tidak valid")
	}

	loc := time.FixedZone("WITA", 8*3600)
	return time.Date(year, time.Month(month), day, hour, min, sec, 0, loc), nil
}
