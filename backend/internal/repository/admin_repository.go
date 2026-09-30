package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"bps-attendance-backend/internal/database"
	"bps-attendance-backend/internal/model"
)

type AdminRepository interface {
	GetDashboardStats(ctx context.Context) (*model.AdminDashboardStats, error)
	GetAllAttendance(ctx context.Context, search, dateStr, startDate, endDate, status, category string, limit, offset int) ([]model.AdminAttendanceItem, int, error)
	GetAttendanceByID(ctx context.Context, id uuid.UUID) (*model.AdminAttendanceItem, error)
	CreateAttendance(ctx context.Context, att *model.Attendance) error
	UpdateAttendance(ctx context.Context, att *model.Attendance) error
	DeleteAttendance(ctx context.Context, id uuid.UUID) error
	GetUsersList(ctx context.Context) ([]model.AdminUserListItem, error)
	CreateAuditCorrection(ctx context.Context, corr *model.AttendanceCorrection) error
	GetCorrectionsByAttendanceID(ctx context.Context, attendanceID uuid.UUID) ([]model.AttendanceCorrectionWithUser, error)
}

type adminRepository struct {
	db *database.DB
}

func NewAdminRepository(db *database.DB) AdminRepository {
	return &adminRepository{db: db}
}

func (r *adminRepository) GetDashboardStats(ctx context.Context) (*model.AdminDashboardStats, error) {
	var stats model.AdminDashboardStats

	// 1. Total active interns and mentors
	countQuery := `
		SELECT 
			COUNT(*) FILTER (WHERE role = 'intern') AS total_interns,
			COUNT(*) FILTER (WHERE role = 'mentor') AS total_mentors
		FROM users
	`
	err := r.db.QueryRowContext(ctx, countQuery).Scan(&stats.TotalInterns, &stats.TotalMentors)
	if err != nil {
		return nil, fmt.Errorf("failed to count users: %w", err)
	}

	// 2. Attendance status counts including Alpha/Belum Hadir for active interns
	attQuery := `
		WITH user_dates AS (
			SELECT status::text AS status FROM attendance

			UNION ALL

			SELECT 
				CASE 
					WHEN d.day < CURRENT_DATE THEN 'ALPHA'
					ELSE 'BELUM_HADIR'
				END AS status
			FROM interns i
			CROSS JOIN LATERAL (
				SELECT generate_series(
					GREATEST(i.start_date, '2026-09-01'::date),
					LEAST(CURRENT_DATE, i.end_date),
					'1 day'::interval
				)::date AS day
			) d
			LEFT JOIN attendance a ON (a.intern_id = i.id OR a.user_id = i.user_id) AND a.attendance_date = d.day
			WHERE i.status = 'active'
			  AND EXTRACT(DOW FROM d.day) BETWEEN 1 AND 5
			  AND a.id IS NULL
		)
		SELECT 
			COUNT(*) AS total_attendance,
			COUNT(*) FILTER (WHERE status = 'HADIR') AS total_hadir,
			COUNT(*) FILTER (WHERE status = 'TERLAMBAT') AS total_terlambat,
			COUNT(*) FILTER (WHERE status = 'IZIN') AS total_izin,
			COUNT(*) FILTER (WHERE status = 'SAKIT') AS total_sakit,
			COUNT(*) FILTER (WHERE status = 'ALPHA') AS total_alpha,
			COUNT(*) FILTER (WHERE status = 'BELUM_HADIR') AS total_belum_hadir
		FROM user_dates
	`
	err = r.db.QueryRowContext(ctx, attQuery).Scan(
		&stats.TotalAttendance,
		&stats.TotalHadir,
		&stats.TotalTerlambat,
		&stats.TotalIzin,
		&stats.TotalSakit,
		&stats.TotalAlpha,
		&stats.TotalBelumHadir,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to aggregate attendance stats: %w", err)
	}

	if stats.TotalAttendance > 0 {
		presentCount := stats.TotalHadir + stats.TotalTerlambat
		stats.AttendanceRate = float64(presentCount) / float64(stats.TotalAttendance) * 100.0
	} else {
		stats.AttendanceRate = 0.0
	}

	return &stats, nil
}

func (r *adminRepository) GetAllAttendance(ctx context.Context, search, dateStr, startDate, endDate, status, category string, limit, offset int) ([]model.AdminAttendanceItem, int, error) {
	baseQuery := `
		FROM (
			SELECT 
				a.id,
				COALESCE(a.user_id, (SELECT user_id FROM interns WHERE id = a.intern_id)) AS user_id,
				a.intern_id,
				a.attendance_date::text AS attendance_date,
				a.check_in, a.check_in_latitude, a.check_in_longitude, a.check_in_accuracy, a.check_in_distance, a.check_in_photo_url,
				a.check_out, a.check_out_latitude, a.check_out_longitude, a.check_out_accuracy, a.check_out_distance, a.check_out_photo_url,
				a.status::text AS status,
				a.notes,
				a.created_at,
				a.updated_at
			FROM attendance a

			UNION ALL

			SELECT 
				'00000000-0000-0000-0000-000000000000'::uuid AS id,
				i.user_id,
				i.id AS intern_id,
				d.day::text AS attendance_date,
				NULL::timestamptz AS check_in, NULL::float8 AS check_in_latitude, NULL::float8 AS check_in_longitude, NULL::float8 AS check_in_accuracy, NULL::float8 AS check_in_distance, NULL::text AS check_in_photo_url,
				NULL::timestamptz AS check_out, NULL::float8 AS check_out_latitude, NULL::float8 AS check_out_longitude, NULL::float8 AS check_out_accuracy, NULL::float8 AS check_out_distance, NULL::text AS check_out_photo_url,
				CASE 
					WHEN d.day < CURRENT_DATE THEN 'ALPHA'
					ELSE 'BELUM_HADIR'
				END AS status,
				NULL::text AS notes,
				d.day::timestamp AS created_at,
				d.day::timestamp AS updated_at
			FROM interns i
			CROSS JOIN LATERAL (
				SELECT generate_series(
					GREATEST(i.start_date, '2026-09-01'::date),
					LEAST(CURRENT_DATE, i.end_date),
					'1 day'::interval
				)::date AS day
			) d
			LEFT JOIN attendance a ON (a.intern_id = i.id OR a.user_id = i.user_id) AND a.attendance_date = d.day
			WHERE i.status = 'active'
			  AND EXTRACT(DOW FROM d.day) BETWEEN 1 AND 5
			  AND a.id IS NULL
		) a
		JOIN users u ON a.user_id = u.id
		LEFT JOIN interns i ON i.user_id = u.id
		WHERE 1=1
	`
	var args []interface{}
	argIdx := 1

	if strings.TrimSpace(search) != "" {
		baseQuery += fmt.Sprintf(` AND (
			u.name ILIKE $%d OR 
			u.email ILIKE $%d OR 
			COALESCE(i.university, '') ILIKE $%d OR 
			COALESCE(i.major, '') ILIKE $%d OR
			COALESCE(a.notes, '') ILIKE $%d
		)`, argIdx, argIdx, argIdx, argIdx, argIdx)
		args = append(args, "%"+strings.TrimSpace(search)+"%")
		argIdx++
	}

	if strings.TrimSpace(dateStr) != "" {
		baseQuery += fmt.Sprintf(` AND a.attendance_date = $%d`, argIdx)
		args = append(args, strings.TrimSpace(dateStr))
		argIdx++
	} else {
		if strings.TrimSpace(startDate) != "" {
			baseQuery += fmt.Sprintf(` AND a.attendance_date >= $%d`, argIdx)
			args = append(args, strings.TrimSpace(startDate))
			argIdx++
		}
		if strings.TrimSpace(endDate) != "" {
			baseQuery += fmt.Sprintf(` AND a.attendance_date <= $%d`, argIdx)
			args = append(args, strings.TrimSpace(endDate))
			argIdx++
		}
	}

	if strings.TrimSpace(status) != "" && strings.ToUpper(status) != "ALL" {
		baseQuery += fmt.Sprintf(` AND a.status = $%d`, argIdx)
		args = append(args, strings.ToUpper(strings.TrimSpace(status)))
		argIdx++
	}

	if strings.TrimSpace(category) != "" && strings.ToUpper(category) != "ALL" {
		cat := strings.ToLower(strings.TrimSpace(category))
		if cat == "intern" || cat == "peserta" || cat == "peserta magang" {
			baseQuery += ` AND u.role = 'intern'`
		} else if cat == "mentor" || cat == "pembimbing" {
			baseQuery += ` AND u.role = 'mentor'`
		}
	}

	// Count total rows matching criteria
	countSQL := "SELECT COUNT(*) " + baseQuery
	var totalRows int
	if err := r.db.QueryRowContext(ctx, countSQL, args...).Scan(&totalRows); err != nil {
		return nil, 0, fmt.Errorf("failed to count admin attendance: %w", err)
	}

	// Select fields
	selectSQL := `
		SELECT 
			a.id,
			u.id AS user_id,
			i.id AS intern_id,
			u.name AS user_name,
			u.email AS user_email,
			u.role::text AS user_role,
			CASE 
				WHEN u.role = 'mentor' THEN 'Mentor'
				ELSE 'Peserta Magang'
			END AS category,
			COALESCE(i.university, '') AS university,
			COALESCE(i.major, '') AS major,
			a.attendance_date,
			a.check_in, a.check_in_latitude, a.check_in_longitude, a.check_in_accuracy, a.check_in_distance, a.check_in_photo_url,
			a.check_out, a.check_out_latitude, a.check_out_longitude, a.check_out_accuracy, a.check_out_distance, a.check_out_photo_url,
			a.status,
			a.notes,
			a.created_at,
			a.updated_at
	` + baseQuery + ` ORDER BY a.attendance_date DESC, u.name ASC`

	if limit > 0 {
		selectSQL += fmt.Sprintf(` LIMIT $%d OFFSET $%d`, argIdx, argIdx+1)
		args = append(args, limit, offset)
	}

	rows, err := r.db.QueryContext(ctx, selectSQL, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query admin attendance: %w", err)
	}
	defer rows.Close()

	var items []model.AdminAttendanceItem
	for rows.Next() {
		var item model.AdminAttendanceItem
		var internID sql.NullString

		err := rows.Scan(
			&item.ID,
			&item.UserID,
			&internID,
			&item.UserName,
			&item.UserEmail,
			&item.UserRole,
			&item.Category,
			&item.University,
			&item.Major,
			&item.AttendanceDate,
			&item.CheckIn, &item.CheckInLatitude, &item.CheckInLongitude, &item.CheckInAccuracy, &item.CheckInDistance, &item.CheckInPhotoURL,
			&item.CheckOut, &item.CheckOutLatitude, &item.CheckOutLongitude, &item.CheckOutAccuracy, &item.CheckOutDistance, &item.CheckOutPhotoURL,
			&item.Status,
			&item.Notes,
			&item.CreatedAt,
			&item.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan admin attendance row: %w", err)
		}

		if internID.Valid && internID.String != "" {
			parsedID, err := uuid.Parse(internID.String)
			if err == nil {
				item.InternID = &parsedID
			}
		}

		items = append(items, item)
	}

	return items, totalRows, nil
}

func (r *adminRepository) GetAttendanceByID(ctx context.Context, id uuid.UUID) (*model.AdminAttendanceItem, error) {
	query := `
		SELECT 
			a.id,
			u.id AS user_id,
			i.id AS intern_id,
			u.name AS user_name,
			u.email AS user_email,
			u.role::text AS user_role,
			CASE 
				WHEN u.role = 'mentor' THEN 'Mentor'
				ELSE 'Peserta Magang'
			END AS category,
			COALESCE(i.university, '') AS university,
			COALESCE(i.major, '') AS major,
			a.attendance_date::text,
			a.check_in, a.check_in_latitude, a.check_in_longitude, a.check_in_accuracy, a.check_in_distance, a.check_in_photo_url,
			a.check_out, a.check_out_latitude, a.check_out_longitude, a.check_out_accuracy, a.check_out_distance, a.check_out_photo_url,
			a.status,
			a.notes,
			a.created_at,
			a.updated_at
		FROM attendance a
		JOIN users u ON COALESCE(a.user_id, (SELECT user_id FROM interns WHERE id = a.intern_id)) = u.id
		LEFT JOIN interns i ON i.user_id = u.id
		WHERE a.id = $1
		LIMIT 1
	`
	var item model.AdminAttendanceItem
	var internID sql.NullString

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&item.ID,
		&item.UserID,
		&internID,
		&item.UserName,
		&item.UserEmail,
		&item.UserRole,
		&item.Category,
		&item.University,
		&item.Major,
		&item.AttendanceDate,
		&item.CheckIn, &item.CheckInLatitude, &item.CheckInLongitude, &item.CheckInAccuracy, &item.CheckInDistance, &item.CheckInPhotoURL,
		&item.CheckOut, &item.CheckOutLatitude, &item.CheckOutLongitude, &item.CheckOutAccuracy, &item.CheckOutDistance, &item.CheckOutPhotoURL,
		&item.Status,
		&item.Notes,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get attendance detail by id: %w", err)
	}

	if internID.Valid && internID.String != "" {
		parsedID, err := uuid.Parse(internID.String)
		if err == nil {
			item.InternID = &parsedID
		}
	}

	return &item, nil
}

func (r *adminRepository) CreateAttendance(ctx context.Context, att *model.Attendance) error {
	if att.ID == uuid.Nil {
		att.ID = uuid.New()
	}
	now := time.Now()
	att.CreatedAt = now
	att.UpdatedAt = now

	// Check if intern_id is needed from user_id if user is intern
	if att.InternID == nil && att.UserID != nil {
		var internID uuid.UUID
		err := r.db.QueryRowContext(ctx, `SELECT id FROM interns WHERE user_id = $1 LIMIT 1`, *att.UserID).Scan(&internID)
		if err == nil {
			att.InternID = &internID
		}
	}

	query := `
		INSERT INTO attendance (
			id, user_id, intern_id, attendance_date,
			check_in, check_in_latitude, check_in_longitude, check_in_accuracy, check_in_distance, check_in_photo_url,
			check_out, check_out_latitude, check_out_longitude, check_out_accuracy, check_out_distance, check_out_photo_url,
			status, notes, created_at, updated_at
		)
		VALUES (
			$1, $2, $3, $4,
			$5, $6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16,
			$17, $18, $19, $20
		)
	`
	_, err := r.db.ExecContext(ctx, query,
		att.ID, att.UserID, att.InternID, att.AttendanceDate,
		att.CheckIn, att.CheckInLatitude, att.CheckInLongitude, att.CheckInAccuracy, att.CheckInDistance, att.CheckInPhotoURL,
		att.CheckOut, att.CheckOutLatitude, att.CheckOutLongitude, att.CheckOutAccuracy, att.CheckOutDistance, att.CheckOutPhotoURL,
		att.Status, att.Notes, att.CreatedAt, att.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert attendance: %w", err)
	}

	return nil
}

func (r *adminRepository) UpdateAttendance(ctx context.Context, att *model.Attendance) error {
	att.UpdatedAt = time.Now()

	query := `
		UPDATE attendance
		SET 
			attendance_date = $1,
			check_in = $2,
			check_in_distance = $3,
			check_out = $4,
			check_out_distance = $5,
			status = $6,
			notes = $7,
			updated_at = $8
		WHERE id = $9
	`
	res, err := r.db.ExecContext(ctx, query,
		att.AttendanceDate,
		att.CheckIn,
		att.CheckInDistance,
		att.CheckOut,
		att.CheckOutDistance,
		att.Status,
		att.Notes,
		att.UpdatedAt,
		att.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update attendance: %w", err)
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check rows affected: %w", err)
	}
	if rows == 0 {
		return errors.New("data absensi tidak ditemukan")
	}

	return nil
}

func (r *adminRepository) DeleteAttendance(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM attendance WHERE id = $1`
	res, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete attendance: %w", err)
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check delete rows affected: %w", err)
	}
	if rows == 0 {
		return errors.New("data absensi tidak ditemukan atau sudah dihapus")
	}

	return nil
}

func (r *adminRepository) GetUsersList(ctx context.Context) ([]model.AdminUserListItem, error) {
	query := `
		SELECT 
			u.id AS user_id,
			i.id AS intern_id,
			u.name,
			u.email,
			u.role::text,
			CASE 
				WHEN u.role = 'mentor' THEN 'Mentor'
				ELSE 'Peserta Magang'
			END AS category,
			COALESCE(i.university, '') AS university,
			COALESCE(i.major, '') AS major
		FROM users u
		LEFT JOIN interns i ON i.user_id = u.id
		WHERE u.role IN ('intern', 'mentor')
		ORDER BY u.role ASC, u.name ASC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get users list: %w", err)
	}
	defer rows.Close()

	var list []model.AdminUserListItem
	for rows.Next() {
		var item model.AdminUserListItem
		var internID sql.NullString

		err := rows.Scan(
			&item.UserID,
			&internID,
			&item.Name,
			&item.Email,
			&item.Role,
			&item.Category,
			&item.University,
			&item.Major,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user list item: %w", err)
		}

		item.ID = item.UserID
		if internID.Valid && internID.String != "" {
			parsedID, err := uuid.Parse(internID.String)
			if err == nil {
				item.InternID = &parsedID
			}
		}

		list = append(list, item)
	}

	return list, nil
}

func (r *adminRepository) CreateAuditCorrection(ctx context.Context, corr *model.AttendanceCorrection) error {
	if corr.ID == uuid.Nil {
		corr.ID = uuid.New()
	}
	corr.CreatedAt = time.Now()

	query := `
		INSERT INTO attendance_corrections (
			id, attendance_id, corrected_by, old_value, new_value, reason, created_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.db.ExecContext(ctx, query,
		corr.ID, corr.AttendanceID, corr.CorrectedBy, corr.OldValue, corr.NewValue, corr.Reason, corr.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert audit correction log: %w", err)
	}

	return nil
}

func (r *adminRepository) GetCorrectionsByAttendanceID(ctx context.Context, attendanceID uuid.UUID) ([]model.AttendanceCorrectionWithUser, error) {
	query := `
		SELECT 
			c.id, c.attendance_id, c.corrected_by, c.old_value, c.new_value, c.reason, c.created_at,
			u.name AS mentor_name, u.email AS mentor_email
		FROM attendance_corrections c
		JOIN users u ON c.corrected_by = u.id
		WHERE c.attendance_id = $1
		ORDER BY c.created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, attendanceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get attendance corrections: %w", err)
	}
	defer rows.Close()

	var list []model.AttendanceCorrectionWithUser
	for rows.Next() {
		var item model.AttendanceCorrectionWithUser

		err := rows.Scan(
			&item.ID, &item.AttendanceID, &item.CorrectedBy, &item.OldValue, &item.NewValue, &item.Reason, &item.CreatedAt,
			&item.MentorName, &item.MentorEmail,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan correction row: %w", err)
		}

		list = append(list, item)
	}

	return list, nil
}
