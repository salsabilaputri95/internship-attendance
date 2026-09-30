package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"bps-attendance-backend/internal/database"
	"bps-attendance-backend/internal/model"
)

type TodayStats struct {
	TotalInterns int `json:"total_interns"`
	Hadir        int `json:"hadir"`
	Terlambat    int `json:"terlambat"`
	Izin         int `json:"izin"`
	Sakit        int `json:"sakit"`
	Alpha        int `json:"alpha"`
	BelumHadir   int `json:"belum_hadir"`
}

type AttendanceRepository interface {
	GetByInternAndDate(ctx context.Context, internID uuid.UUID, dateStr string) (*model.Attendance, error)
	GetByID(ctx context.Context, id uuid.UUID) (*model.Attendance, error)
	GetDetailByID(ctx context.Context, id uuid.UUID) (*model.AttendanceDetailResponse, error)
	CreateCheckIn(ctx context.Context, att *model.Attendance) error
	UpdateCheckOut(ctx context.Context, att *model.Attendance) error
	GetHistoryByIntern(ctx context.Context, internID uuid.UUID, limit, offset int) ([]model.Attendance, error)
	GetFullHistoryByIntern(ctx context.Context, internID uuid.UUID) ([]model.Attendance, error)
	GetTodayAllAttendance(ctx context.Context, dateStr string, search string, status string) ([]model.AttendanceDetailResponse, error)
	GetTodayStats(ctx context.Context, dateStr string) (*TodayStats, error)
	CreateCorrection(ctx context.Context, corr *model.AttendanceCorrection) error
	UpdateAttendanceByCorrection(ctx context.Context, att *model.Attendance) error
	GetCorrectionsByAttendanceID(ctx context.Context, attendanceID uuid.UUID) ([]model.AttendanceCorrectionWithUser, error)
}

type attendanceRepository struct {
	db *database.DB
}

func NewAttendanceRepository(db *database.DB) AttendanceRepository {
	return &attendanceRepository{db: db}
}

func (r *attendanceRepository) GetByInternAndDate(ctx context.Context, internID uuid.UUID, dateStr string) (*model.Attendance, error) {
	query := `
		SELECT 
			id, intern_id, attendance_date::text,
			check_in, check_in_latitude, check_in_longitude, check_in_accuracy, check_in_distance, check_in_photo_url,
			check_out, check_out_latitude, check_out_longitude, check_out_accuracy, check_out_distance, check_out_photo_url,
			status, notes, created_at, updated_at
		FROM attendance
		WHERE intern_id = $1 AND attendance_date = $2
		LIMIT 1
	`

	var a model.Attendance
	err := r.db.QueryRowContext(ctx, query, internID, dateStr).Scan(
		&a.ID, &a.InternID, &a.AttendanceDate,
		&a.CheckIn, &a.CheckInLatitude, &a.CheckInLongitude, &a.CheckInAccuracy, &a.CheckInDistance, &a.CheckInPhotoURL,
		&a.CheckOut, &a.CheckOutLatitude, &a.CheckOutLongitude, &a.CheckOutAccuracy, &a.CheckOutDistance, &a.CheckOutPhotoURL,
		&a.Status, &a.Notes, &a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get attendance by intern and date: %w", err)
	}

	return &a, nil
}

func (r *attendanceRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Attendance, error) {
	query := `
		SELECT 
			id, intern_id, attendance_date::text,
			check_in, check_in_latitude, check_in_longitude, check_in_accuracy, check_in_distance, check_in_photo_url,
			check_out, check_out_latitude, check_out_longitude, check_out_accuracy, check_out_distance, check_out_photo_url,
			status, notes, created_at, updated_at
		FROM attendance
		WHERE id = $1
		LIMIT 1
	`

	var a model.Attendance
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&a.ID, &a.InternID, &a.AttendanceDate,
		&a.CheckIn, &a.CheckInLatitude, &a.CheckInLongitude, &a.CheckInAccuracy, &a.CheckInDistance, &a.CheckInPhotoURL,
		&a.CheckOut, &a.CheckOutLatitude, &a.CheckOutLongitude, &a.CheckOutAccuracy, &a.CheckOutDistance, &a.CheckOutPhotoURL,
		&a.Status, &a.Notes, &a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get attendance by id: %w", err)
	}

	return &a, nil
}

func (r *attendanceRepository) GetDetailByID(ctx context.Context, id uuid.UUID) (*model.AttendanceDetailResponse, error) {
	query := `
		SELECT 
			a.id, a.intern_id, a.attendance_date::text,
			a.check_in, a.check_in_latitude, a.check_in_longitude, a.check_in_accuracy, a.check_in_distance, a.check_in_photo_url,
			a.check_out, a.check_out_latitude, a.check_out_longitude, a.check_out_accuracy, a.check_out_distance, a.check_out_photo_url,
			a.status, a.notes, a.created_at, a.updated_at,
			u.name as intern_name, i.university as intern_university, i.major as intern_major
		FROM attendance a
		JOIN interns i ON a.intern_id = i.id
		JOIN users u ON i.user_id = u.id
		WHERE a.id = $1
		LIMIT 1
	`

	var d model.AttendanceDetailResponse
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&d.ID, &d.InternID, &d.AttendanceDate,
		&d.CheckIn, &d.CheckInLatitude, &d.CheckInLongitude, &d.CheckInAccuracy, &d.CheckInDistance, &d.CheckInPhotoURL,
		&d.CheckOut, &d.CheckOutLatitude, &d.CheckOutLongitude, &d.CheckOutAccuracy, &d.CheckOutDistance, &d.CheckOutPhotoURL,
		&d.Status, &d.Notes, &d.CreatedAt, &d.UpdatedAt,
		&d.InternName, &d.InternUniversity, &d.InternMajor,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get attendance detail: %w", err)
	}

	return &d, nil
}

func (r *attendanceRepository) CreateCheckIn(ctx context.Context, att *model.Attendance) error {
	query := `
		INSERT INTO attendance (
			id, intern_id, attendance_date,
			check_in, check_in_latitude, check_in_longitude, check_in_accuracy, check_in_distance, check_in_photo_url,
			status, notes, created_at, updated_at
		) VALUES (
			$1, $2, $3,
			$4, $5, $6, $7, $8, $9,
			$10, $11, $12, $13
		)
		ON CONFLICT (intern_id, attendance_date)
		DO UPDATE SET
			check_in = EXCLUDED.check_in,
			check_in_latitude = EXCLUDED.check_in_latitude,
			check_in_longitude = EXCLUDED.check_in_longitude,
			check_in_accuracy = EXCLUDED.check_in_accuracy,
			check_in_distance = EXCLUDED.check_in_distance,
			check_in_photo_url = EXCLUDED.check_in_photo_url,
			status = EXCLUDED.status,
			notes = EXCLUDED.notes,
			updated_at = EXCLUDED.updated_at
	`

	if att.ID == uuid.Nil {
		att.ID = uuid.New()
	}
	now := time.Now()
	att.CreatedAt = now
	att.UpdatedAt = now

	_, err := r.db.ExecContext(
		ctx, query,
		att.ID, att.InternID, att.AttendanceDate,
		att.CheckIn, att.CheckInLatitude, att.CheckInLongitude, att.CheckInAccuracy, att.CheckInDistance, att.CheckInPhotoURL,
		att.Status, att.Notes, att.CreatedAt, att.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to save check-in attendance: %w", err)
	}

	return nil
}

func (r *attendanceRepository) UpdateCheckOut(ctx context.Context, att *model.Attendance) error {
	query := `
		UPDATE attendance
		SET
			check_out = $1,
			check_out_latitude = $2,
			check_out_longitude = $3,
			check_out_accuracy = $4,
			check_out_distance = $5,
			check_out_photo_url = $6,
			updated_at = $7
		WHERE id = $8
	`

	att.UpdatedAt = time.Now()
	res, err := r.db.ExecContext(
		ctx, query,
		att.CheckOut, att.CheckOutLatitude, att.CheckOutLongitude,
		att.CheckOutAccuracy, att.CheckOutDistance, att.CheckOutPhotoURL,
		att.UpdatedAt, att.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update check-out: %w", err)
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		return errors.New("attendance record not found")
	}

	return nil
}

func (r *attendanceRepository) GetHistoryByIntern(ctx context.Context, internID uuid.UUID, limit, offset int) ([]model.Attendance, error) {
	if limit <= 0 {
		limit = 31
	}

	query := `
		SELECT 
			id, intern_id, attendance_date::text,
			check_in, check_in_latitude, check_in_longitude, check_in_accuracy, check_in_distance, check_in_photo_url,
			check_out, check_out_latitude, check_out_longitude, check_out_accuracy, check_out_distance, check_out_photo_url,
			status, notes, created_at, updated_at
		FROM attendance
		WHERE intern_id = $1
		ORDER BY attendance_date DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, internID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query attendance history: %w", err)
	}
	defer rows.Close()

	var list []model.Attendance
	for rows.Next() {
		var a model.Attendance
		if err := rows.Scan(
			&a.ID, &a.InternID, &a.AttendanceDate,
			&a.CheckIn, &a.CheckInLatitude, &a.CheckInLongitude, &a.CheckInAccuracy, &a.CheckInDistance, &a.CheckInPhotoURL,
			&a.CheckOut, &a.CheckOutLatitude, &a.CheckOutLongitude, &a.CheckOutAccuracy, &a.CheckOutDistance, &a.CheckOutPhotoURL,
			&a.Status, &a.Notes, &a.CreatedAt, &a.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan attendance history row: %w", err)
		}
		list = append(list, a)
	}

	return list, nil
}

func (r *attendanceRepository) GetFullHistoryByIntern(ctx context.Context, internID uuid.UUID) ([]model.Attendance, error) {
	query := `
		WITH workdays AS (
			SELECT generate_series(
				GREATEST(i.start_date, '2026-09-01'::date),
				LEAST(CURRENT_DATE, i.end_date),
				'1 day'::interval
			)::date AS day
			FROM interns i
			WHERE i.id = $1
		),
		all_dates AS (
			SELECT day FROM workdays WHERE EXTRACT(DOW FROM day) BETWEEN 1 AND 5
			UNION
			SELECT attendance_date FROM attendance WHERE intern_id = $1
		)
		SELECT 
			COALESCE(a.id, '00000000-0000-0000-0000-000000000000'::uuid) as id,
			$1 as intern_id,
			d.day::text as attendance_date,
			a.check_in, a.check_in_latitude, a.check_in_longitude, a.check_in_accuracy, a.check_in_distance, a.check_in_photo_url,
			a.check_out, a.check_out_latitude, a.check_out_longitude, a.check_out_accuracy, a.check_out_distance, a.check_out_photo_url,
			CASE 
				WHEN a.status IS NOT NULL THEN a.status
				WHEN d.day >= '2026-09-01'::date AND d.day < CURRENT_DATE AND EXTRACT(DOW FROM d.day) BETWEEN 1 AND 5 THEN 'ALPHA'
				ELSE 'BELUM_HADIR'
			END as status,
			a.notes,
			COALESCE(a.created_at, NOW()) as created_at,
			COALESCE(a.updated_at, NOW()) as updated_at
		FROM all_dates d
		LEFT JOIN attendance a ON a.intern_id = $1 AND a.attendance_date = d.day
		ORDER BY d.day DESC
	`

	rows, err := r.db.QueryContext(ctx, query, internID)
	if err != nil {
		return nil, fmt.Errorf("failed to query full attendance history: %w", err)
	}
	defer rows.Close()

	var list []model.Attendance
	for rows.Next() {
		var a model.Attendance
		if err := rows.Scan(
			&a.ID, &a.InternID, &a.AttendanceDate,
			&a.CheckIn, &a.CheckInLatitude, &a.CheckInLongitude, &a.CheckInAccuracy, &a.CheckInDistance, &a.CheckInPhotoURL,
			&a.CheckOut, &a.CheckOutLatitude, &a.CheckOutLongitude, &a.CheckOutAccuracy, &a.CheckOutDistance, &a.CheckOutPhotoURL,
			&a.Status, &a.Notes, &a.CreatedAt, &a.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan full attendance row: %w", err)
		}
		list = append(list, a)
	}

	return list, nil
}

func (r *attendanceRepository) GetTodayAllAttendance(ctx context.Context, dateStr string, search string, status string) ([]model.AttendanceDetailResponse, error) {
	query := `
		SELECT 
			COALESCE(a.id, '00000000-0000-0000-0000-000000000000'::uuid) as id,
			i.id as intern_id,
			$1 as attendance_date,
			a.check_in, a.check_in_latitude, a.check_in_longitude, a.check_in_accuracy, a.check_in_distance, a.check_in_photo_url,
			a.check_out, a.check_out_latitude, a.check_out_longitude, a.check_out_accuracy, a.check_out_distance, a.check_out_photo_url,
			CASE 
				WHEN a.status IS NOT NULL THEN a.status
				WHEN $1::date >= '2026-09-01'::date AND $1::date < CURRENT_DATE AND EXTRACT(DOW FROM $1::date) BETWEEN 1 AND 5 THEN 'ALPHA'
				ELSE 'BELUM_HADIR'
			END as status,
			a.notes,
			COALESCE(a.created_at, NOW()) as created_at,
			COALESCE(a.updated_at, NOW()) as updated_at,
			u.name as intern_name,
			i.university as intern_university,
			i.major as intern_major
		FROM interns i
		JOIN users u ON i.user_id = u.id
		LEFT JOIN attendance a ON i.id = a.intern_id AND a.attendance_date = $1::date
		WHERE i.status = 'active'
		  AND ($2 = '' OR LOWER(u.name) LIKE '%' || LOWER($2) || '%' OR LOWER(i.university) LIKE '%' || LOWER($2) || '%' OR LOWER(i.major) LIKE '%' || LOWER($2) || '%')
		  AND ($3 = '' OR (
				CASE 
					WHEN a.status IS NOT NULL THEN a.status
					WHEN $1::date >= '2026-09-01'::date AND $1::date < CURRENT_DATE AND EXTRACT(DOW FROM $1::date) BETWEEN 1 AND 5 THEN 'ALPHA'
					ELSE 'BELUM_HADIR'
				END
		  ) = $3)
		ORDER BY u.name ASC
	`

	rows, err := r.db.QueryContext(ctx, query, dateStr, search, status)
	if err != nil {
		return nil, fmt.Errorf("failed to list today attendance: %w", err)
	}
	defer rows.Close()

	var list []model.AttendanceDetailResponse
	for rows.Next() {
		var d model.AttendanceDetailResponse
		if err := rows.Scan(
			&d.ID, &d.InternID, &d.AttendanceDate,
			&d.CheckIn, &d.CheckInLatitude, &d.CheckInLongitude, &d.CheckInAccuracy, &d.CheckInDistance, &d.CheckInPhotoURL,
			&d.CheckOut, &d.CheckOutLatitude, &d.CheckOutLongitude, &d.CheckOutAccuracy, &d.CheckOutDistance, &d.CheckOutPhotoURL,
			&d.Status, &d.Notes, &d.CreatedAt, &d.UpdatedAt,
			&d.InternName, &d.InternUniversity, &d.InternMajor,
		); err != nil {
			return nil, fmt.Errorf("failed to scan attendance item: %w", err)
		}
		list = append(list, d)
	}

	return list, nil
}

func (r *attendanceRepository) GetTodayStats(ctx context.Context, dateStr string) (*TodayStats, error) {
	query := `
		SELECT 
			COUNT(i.id) as total_interns,
			COUNT(CASE WHEN a.status = 'HADIR' THEN 1 END) as hadir,
			COUNT(CASE WHEN a.status = 'TERLAMBAT' THEN 1 END) as terlambat,
			COUNT(CASE WHEN a.status = 'IZIN' THEN 1 END) as izin,
			COUNT(CASE WHEN a.status = 'SAKIT' THEN 1 END) as sakit,
			COUNT(CASE 
				WHEN a.status = 'ALPHA' THEN 1 
				WHEN (a.status IS NULL OR a.status = 'BELUM_HADIR') AND $1::date >= '2026-09-01'::date AND $1::date < CURRENT_DATE AND EXTRACT(DOW FROM $1::date) BETWEEN 1 AND 5 THEN 1
			END) as alpha,
			COUNT(CASE 
				WHEN (a.status IS NULL OR a.status = 'BELUM_HADIR') AND NOT ($1::date >= '2026-09-01'::date AND $1::date < CURRENT_DATE AND EXTRACT(DOW FROM $1::date) BETWEEN 1 AND 5) THEN 1 
			END) as belum_hadir
		FROM interns i
		LEFT JOIN attendance a ON i.id = a.intern_id AND a.attendance_date = $1::date
		WHERE i.status = 'active'
	`

	var s TodayStats
	err := r.db.QueryRowContext(ctx, query, dateStr).Scan(
		&s.TotalInterns, &s.Hadir, &s.Terlambat, &s.Izin, &s.Sakit, &s.Alpha, &s.BelumHadir,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query today stats: %w", err)
	}

	return &s, nil
}

func (r *attendanceRepository) CreateCorrection(ctx context.Context, corr *model.AttendanceCorrection) error {
	query := `
		INSERT INTO attendance_corrections (
			id, attendance_id, corrected_by, old_value, new_value, reason, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		)
	`

	if corr.ID == uuid.Nil {
		corr.ID = uuid.New()
	}
	corr.CreatedAt = time.Now()

	_, err := r.db.ExecContext(
		ctx, query,
		corr.ID, corr.AttendanceID, corr.CorrectedBy,
		corr.OldValue, corr.NewValue, corr.Reason, corr.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create attendance correction log: %w", err)
	}

	return nil
}

func (r *attendanceRepository) UpdateAttendanceByCorrection(ctx context.Context, att *model.Attendance) error {
	query := `
		UPDATE attendance
		SET 
			check_in = $1,
			check_out = $2,
			status = $3,
			notes = $4,
			updated_at = $5
		WHERE id = $6
	`

	att.UpdatedAt = time.Now()
	res, err := r.db.ExecContext(
		ctx, query,
		att.CheckIn, att.CheckOut, att.Status, att.Notes, att.UpdatedAt, att.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update attendance record by correction: %w", err)
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		return errors.New("attendance record not found")
	}

	return nil
}

func (r *attendanceRepository) GetCorrectionsByAttendanceID(ctx context.Context, attendanceID uuid.UUID) ([]model.AttendanceCorrectionWithUser, error) {
	query := `
		SELECT 
			c.id, c.attendance_id, c.corrected_by, c.old_value, c.new_value, c.reason, c.created_at,
			u.name as mentor_name, u.email as mentor_email
		FROM attendance_corrections c
		JOIN users u ON c.corrected_by = u.id
		WHERE c.attendance_id = $1
		ORDER BY c.created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, attendanceID)
	if err != nil {
		return nil, fmt.Errorf("failed to query corrections: %w", err)
	}
	defer rows.Close()

	var list []model.AttendanceCorrectionWithUser
	for rows.Next() {
		var c model.AttendanceCorrectionWithUser
		if err := rows.Scan(
			&c.ID, &c.AttendanceID, &c.CorrectedBy, &c.OldValue, &c.NewValue, &c.Reason, &c.CreatedAt,
			&c.MentorName, &c.MentorEmail,
		); err != nil {
			return nil, fmt.Errorf("failed to scan correction row: %w", err)
		}
		list = append(list, c)
	}

	return list, nil
}
