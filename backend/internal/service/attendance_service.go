package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/google/uuid"

	"bps-attendance-backend/internal/model"
	"bps-attendance-backend/internal/repository"
	"bps-attendance-backend/internal/storage"
	"bps-attendance-backend/internal/utils"
)

type CheckInRequest struct {
	InternID    uuid.UUID
	Latitude    float64
	Longitude   float64
	Accuracy    float64
	Notes       string
	PhotoReader io.Reader
	PhotoName   string
	PhotoType   string
	PhotoSize   int64
}

type CheckOutRequest struct {
	InternID    uuid.UUID
	Latitude    float64
	Longitude   float64
	Accuracy    float64
	Notes       string
	PhotoReader io.Reader
	PhotoName   string
	PhotoType   string
	PhotoSize   int64
}

type AttendanceSummary struct {
	Hadir      int `json:"hadir"`
	Terlambat  int `json:"terlambat"`
	Izin       int `json:"izin"`
	Alpha      int `json:"alpha"`
	TotalAbsen int `json:"total_absen"`
}

type TodayAttendanceResponse struct {
	Attendance      *model.Attendance `json:"attendance"`
	OfficeLocation  *model.Location   `json:"office_location"`
	CurrentDistance *float64          `json:"current_distance,omitempty"`
	Summary         AttendanceSummary `json:"summary"`
}

type LeaveRequest struct {
	InternID uuid.UUID `json:"intern_id"`
	Date     string    `json:"date"` // YYYY-MM-DD (optional, defaults to today)
	Category string    `json:"category"`
	Reason   string    `json:"reason"`
}

type AttendanceService interface {
	CheckIn(ctx context.Context, req *CheckInRequest) (*model.Attendance, error)
	CheckOut(ctx context.Context, req *CheckOutRequest) (*model.Attendance, error)
	SubmitLeave(ctx context.Context, req *LeaveRequest) (*model.Attendance, error)
	GetToday(ctx context.Context, internID uuid.UUID) (*TodayAttendanceResponse, error)
	GetHistory(ctx context.Context, internID uuid.UUID, limit, offset int) ([]model.Attendance, *AttendanceSummary, error)
	GetByID(ctx context.Context, id uuid.UUID) (*model.AttendanceDetailResponse, error)
}

type attendanceService struct {
	attRepo      repository.AttendanceRepository
	locRepo      repository.LocationRepository
	internRepo   repository.InternRepository
	storageServ  storage.StorageService
}

func NewAttendanceService(
	attRepo repository.AttendanceRepository,
	locRepo repository.LocationRepository,
	internRepo repository.InternRepository,
	storageServ storage.StorageService,
) AttendanceService {
	return &attendanceService{
		attRepo:     attRepo,
		locRepo:     locRepo,
		internRepo:  internRepo,
		storageServ: storageServ,
	}
}

func (s *attendanceService) CheckIn(ctx context.Context, req *CheckInRequest) (*model.Attendance, error) {
	// 1. Verify intern profile
	intern, err := s.internRepo.GetByID(ctx, req.InternID)
	if err != nil {
		return nil, fmt.Errorf("error verifying intern: %w", err)
	}
	if intern == nil || intern.Status != model.InternStatusActive {
		return nil, errors.New("profil peserta magang tidak ditemukan atau status tidak aktif")
	}

	// 2. Fetch active office location
	officeLoc, err := s.locRepo.GetActiveLocation(ctx)
	if err != nil {
		return nil, fmt.Errorf("error getting office location: %w", err)
	}
	if officeLoc == nil {
		return nil, errors.New("konfigurasi lokasi kantor belum tersedia")
	}

	// 3. Calculate Geofence Distance (Haversine in Go Backend)
	distance := utils.CalculateHaversineDistance(officeLoc.Latitude, officeLoc.Longitude, req.Latitude, req.Longitude)
	if !utils.IsWithinRadius(distance, officeLoc.Radius) {
		return nil, fmt.Errorf("lokasi Anda berjarak %.1f meter dari kantor (maksimal toleransi radius %.0f meter). Mohon lakukan absensi di dalam area kantor", distance, officeLoc.Radius)
	}

	// 4. Check if already checked in today
	todayStr := time.Now().Format("2006-01-02")
	existing, err := s.attRepo.GetByInternAndDate(ctx, req.InternID, todayStr)
	if err != nil {
		return nil, fmt.Errorf("error checking existing attendance: %w", err)
	}
	if existing != nil && existing.CheckIn != nil {
		return nil, errors.New("Anda sudah melakukan absen masuk hari ini")
	}

	// 5. Upload Selfie Photo (Optional / Disabled for fast response)
	var photoURLPtr *string
	if req.PhotoReader != nil && req.PhotoSize > 0 {
		photoURL, err := s.storageServ.UploadFile(ctx, req.PhotoName, req.PhotoType, req.PhotoReader, req.PhotoSize)
		if err == nil {
			photoURLPtr = &photoURL
		}
	}

	// 6. Determine status (Hadir <= 07:30 WITA, Terlambat > 07:30 WITA)
	now := time.Now()
	status := model.StatusHadir
	// Check against 07:30 threshold
	if now.Hour() > 7 || (now.Hour() == 7 && now.Minute() > 30) {
		status = model.StatusTerlambat
	}

	// 7. Save check-in
	att := &model.Attendance{
		ID:               uuid.New(),
		InternID:         &req.InternID,
		AttendanceDate:   todayStr,
		CheckIn:          &now,
		CheckInLatitude:  &req.Latitude,
		CheckInLongitude: &req.Longitude,
		CheckInAccuracy:  &req.Accuracy,
		CheckInDistance:  &distance,
		CheckInPhotoURL:  photoURLPtr,
		Status:           status,
	}
	if req.Notes != "" {
		att.Notes = &req.Notes
	}

	if err := s.attRepo.CreateCheckIn(ctx, att); err != nil {
		return nil, fmt.Errorf("gagal menyimpan data absensi: %w", err)
	}

	return att, nil
}

func (s *attendanceService) CheckOut(ctx context.Context, req *CheckOutRequest) (*model.Attendance, error) {
	// 1. Verify intern profile
	intern, err := s.internRepo.GetByID(ctx, req.InternID)
	if err != nil {
		return nil, fmt.Errorf("error verifying intern: %w", err)
	}
	if intern == nil || intern.Status != model.InternStatusActive {
		return nil, errors.New("profil peserta magang tidak ditemukan atau tidak aktif")
	}

	// 2. Fetch active office location
	officeLoc, err := s.locRepo.GetActiveLocation(ctx)
	if err != nil {
		return nil, fmt.Errorf("error getting office location: %w", err)
	}
	if officeLoc == nil {
		return nil, errors.New("konfigurasi lokasi kantor belum tersedia")
	}

	// 3. Calculate Geofence Distance
	distance := utils.CalculateHaversineDistance(officeLoc.Latitude, officeLoc.Longitude, req.Latitude, req.Longitude)
	if !utils.IsWithinRadius(distance, officeLoc.Radius) {
		return nil, fmt.Errorf("lokasi Anda berjarak %.1f meter dari kantor (maksimal toleransi radius %.0f meter). Mohon lakukan absensi di dalam area kantor", distance, officeLoc.Radius)
	}

	// 4. Verify check-in exists for today
	todayStr := time.Now().Format("2006-01-02")
	existing, err := s.attRepo.GetByInternAndDate(ctx, req.InternID, todayStr)
	if err != nil {
		return nil, fmt.Errorf("error checking existing attendance: %w", err)
	}
	if existing == nil || existing.CheckIn == nil {
		return nil, errors.New("Anda belum melakukan absen masuk hari ini")
	}
	if existing.CheckOut != nil {
		return nil, errors.New("Anda sudah melakukan absen pulang hari ini")
	}

	// 5. Upload Selfie Photo (Optional / Disabled for fast response)
	if req.PhotoReader != nil && req.PhotoSize > 0 {
		photoURL, err := s.storageServ.UploadFile(ctx, req.PhotoName, req.PhotoType, req.PhotoReader, req.PhotoSize)
		if err == nil {
			existing.CheckOutPhotoURL = &photoURL
		}
	}

	// 6. Update Check Out
	now := time.Now()
	existing.CheckOut = &now
	existing.CheckOutLatitude = &req.Latitude
	existing.CheckOutLongitude = &req.Longitude
	existing.CheckOutAccuracy = &req.Accuracy
	existing.CheckOutDistance = &distance

	if err := s.attRepo.UpdateCheckOut(ctx, existing); err != nil {
		return nil, fmt.Errorf("gagal memperbarui data absen pulang: %w", err)
	}

	return existing, nil
}

func (s *attendanceService) GetToday(ctx context.Context, internID uuid.UUID) (*TodayAttendanceResponse, error) {
	todayStr := time.Now().Format("2006-01-02")
	att, err := s.attRepo.GetByInternAndDate(ctx, internID, todayStr)
	if err != nil {
		return nil, fmt.Errorf("error getting today attendance: %w", err)
	}

	officeLoc, err := s.locRepo.GetActiveLocation(ctx)
	if err != nil {
		return nil, fmt.Errorf("error getting location: %w", err)
	}

	// Calculate summary for this intern
	history, err := s.attRepo.GetHistoryByIntern(ctx, internID, 100, 0)
	if err != nil {
		return nil, fmt.Errorf("error calculating summary: %w", err)
	}

	summary := calculateSummary(history)

	return &TodayAttendanceResponse{
		Attendance:     att,
		OfficeLocation: officeLoc,
		Summary:        summary,
	}, nil
}

func (s *attendanceService) GetHistory(ctx context.Context, internID uuid.UUID, limit, offset int) ([]model.Attendance, *AttendanceSummary, error) {
	history, err := s.attRepo.GetHistoryByIntern(ctx, internID, limit, offset)
	if err != nil {
		return nil, nil, fmt.Errorf("error retrieving attendance history: %w", err)
	}

	summary := calculateSummary(history)
	return history, &summary, nil
}

func (s *attendanceService) GetByID(ctx context.Context, id uuid.UUID) (*model.AttendanceDetailResponse, error) {
	detail, err := s.attRepo.GetDetailByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("error retrieving attendance detail: %w", err)
	}
	if detail == nil {
		return nil, errors.New("data absensi tidak ditemukan")
	}

	return detail, nil
}

func (s *attendanceService) SubmitLeave(ctx context.Context, req *LeaveRequest) (*model.Attendance, error) {
	if req.Reason == "" {
		return nil, errors.New("alasan pengajuan izin wajib diisi")
	}

	intern, err := s.internRepo.GetByID(ctx, req.InternID)
	if err != nil {
		return nil, fmt.Errorf("error verifying intern: %w", err)
	}
	if intern == nil || intern.Status != model.InternStatusActive {
		return nil, errors.New("profil peserta magang tidak ditemukan atau status tidak aktif")
	}

	dateStr := req.Date
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	// Check existing attendance
	existing, err := s.attRepo.GetByInternAndDate(ctx, req.InternID, dateStr)
	if err != nil {
		return nil, fmt.Errorf("error checking existing attendance: %w", err)
	}
	if existing != nil && (existing.CheckIn != nil || existing.Status == model.StatusIzin) {
		return nil, errors.New("data presensi/izin sudah tercatat untuk tanggal ini")
	}

	fullNotes := fmt.Sprintf("[%s] %s", req.Category, req.Reason)
	if req.Category == "" {
		fullNotes = req.Reason
	}

	att := &model.Attendance{
		ID:             uuid.New(),
		InternID:       &req.InternID,
		AttendanceDate: dateStr,
		Status:         model.StatusIzin,
		Notes:          &fullNotes,
	}

	if err := s.attRepo.CreateCheckIn(ctx, att); err != nil {
		return nil, fmt.Errorf("gagal menyimpan data pengajuan izin: %w", err)
	}

	return att, nil
}

func calculateSummary(history []model.Attendance) AttendanceSummary {
	var sum AttendanceSummary
	for _, a := range history {
		switch a.Status {
		case model.StatusHadir:
			sum.Hadir++
		case model.StatusTerlambat:
			sum.Terlambat++
		case model.StatusIzin:
			sum.Izin++
		case model.StatusAlpha:
			sum.Alpha++
		}
	}
	sum.TotalAbsen = len(history)
	return sum
}
