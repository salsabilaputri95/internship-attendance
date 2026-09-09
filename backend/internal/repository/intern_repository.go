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

type InternRepository interface {
	GetByUserID(ctx context.Context, userID uuid.UUID) (*model.Intern, error)
	GetByID(ctx context.Context, id uuid.UUID) (*model.Intern, error)
	GetWithUserByID(ctx context.Context, id uuid.UUID) (*model.InternWithUser, error)
	ListAllInterns(ctx context.Context, status string) ([]model.InternWithUser, error)
	CreateIntern(ctx context.Context, intern *model.Intern) error
}

type internRepository struct {
	db *database.DB
}

func NewInternRepository(db *database.DB) InternRepository {
	return &internRepository{db: db}
}

func (r *internRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*model.Intern, error) {
	query := `
		SELECT id, user_id, university, major, phone, supervisor_id, start_date::text, end_date::text, status, created_at, updated_at
		FROM interns
		WHERE user_id = $1
		LIMIT 1
	`

	var i model.Intern
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&i.ID, &i.UserID, &i.University, &i.Major, &i.Phone, &i.SupervisorID,
		&i.StartDate, &i.EndDate, &i.Status, &i.CreatedAt, &i.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get intern by user_id: %w", err)
	}

	return &i, nil
}

func (r *internRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Intern, error) {
	query := `
		SELECT id, user_id, university, major, phone, supervisor_id, start_date::text, end_date::text, status, created_at, updated_at
		FROM interns
		WHERE id = $1
		LIMIT 1
	`

	var i model.Intern
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&i.ID, &i.UserID, &i.University, &i.Major, &i.Phone, &i.SupervisorID,
		&i.StartDate, &i.EndDate, &i.Status, &i.CreatedAt, &i.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get intern by id: %w", err)
	}

	return &i, nil
}

func (r *internRepository) GetWithUserByID(ctx context.Context, id uuid.UUID) (*model.InternWithUser, error) {
	query := `
		WITH intern_workdays AS (
			SELECT 
				i.id AS intern_id,
				COUNT(d.day) AS total_working_days
			FROM interns i
			CROSS JOIN LATERAL (
				SELECT generate_series(
					GREATEST(i.start_date, '2026-09-01'::date),
					LEAST(CURRENT_DATE, i.end_date),
					'1 day'::interval
				)::date AS day
			) d
			WHERE EXTRACT(DOW FROM d.day) BETWEEN 1 AND 5
			  AND GREATEST(i.start_date, '2026-09-01'::date) <= LEAST(CURRENT_DATE, i.end_date)
			  AND i.id = $1
			GROUP BY i.id
		),
		intern_att AS (
			SELECT 
				a.intern_id,
				COUNT(CASE WHEN a.status = 'HADIR' THEN 1 END) AS hadir,
				COUNT(CASE WHEN a.status = 'TERLAMBAT' THEN 1 END) AS terlambat,
				COUNT(CASE WHEN a.status = 'IZIN' THEN 1 END) AS izin,
				COUNT(CASE WHEN a.status = 'ALPHA' THEN 1 END) AS explicit_alpha,
				COUNT(CASE WHEN a.status IN ('HADIR', 'TERLAMBAT', 'IZIN', 'ALPHA') AND EXTRACT(DOW FROM a.attendance_date) BETWEEN 1 AND 5 THEN 1 END) AS attended_working_days
			FROM attendance a
			JOIN interns i ON a.intern_id = i.id
			WHERE a.attendance_date >= GREATEST(i.start_date, '2026-09-01'::date) 
			  AND a.attendance_date <= LEAST(CURRENT_DATE, i.end_date)
			  AND a.intern_id = $1
			GROUP BY a.intern_id
		)
		SELECT 
			i.id, i.user_id, u.name, u.email, i.university, i.major, i.phone,
			i.supervisor_id, sup.name as supervisor_name,
			i.start_date::text, i.end_date::text, i.status,
			COALESCE(w.total_working_days, 0) AS total_working_days,
			COALESCE(att.hadir, 0) AS hadir,
			COALESCE(att.terlambat, 0) AS terlambat,
			COALESCE(att.izin, 0) AS izin,
			COALESCE(att.explicit_alpha, 0) + GREATEST(0, COALESCE(w.total_working_days, 0) - COALESCE(att.attended_working_days, 0)) AS alpha
		FROM interns i
		JOIN users u ON i.user_id = u.id
		LEFT JOIN users sup ON i.supervisor_id = sup.id
		LEFT JOIN intern_workdays w ON i.id = w.intern_id
		LEFT JOIN intern_att att ON i.id = att.intern_id
		WHERE i.id = $1
		LIMIT 1
	`

	var iu model.InternWithUser
	var totalDays, hadir, terlambat, izin, alpha int
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&iu.ID, &iu.UserID, &iu.Name, &iu.Email, &iu.University, &iu.Major, &iu.Phone,
		&iu.SupervisorID, &iu.SupervisorName, &iu.StartDate, &iu.EndDate, &iu.Status,
		&totalDays, &hadir, &terlambat, &izin, &alpha,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get intern with user details: %w", err)
	}

	rate := 0.0
	if totalDays > 0 {
		rate = float64(hadir+terlambat) / float64(totalDays) * 100.0
		if rate > 100.0 {
			rate = 100.0
		}
	}

	iu.AttendanceSummary = model.AttendanceSummary{
		Hadir:            hadir,
		Terlambat:        terlambat,
		Izin:             izin,
		Alpha:            alpha,
		TotalWorkingDays: totalDays,
		AttendanceRate:   rate,
	}

	return &iu, nil
}

func (r *internRepository) ListAllInterns(ctx context.Context, status string) ([]model.InternWithUser, error) {
	query := `
		WITH intern_workdays AS (
			SELECT 
				i.id AS intern_id,
				COUNT(d.day) AS total_working_days
			FROM interns i
			CROSS JOIN LATERAL (
				SELECT generate_series(
					GREATEST(i.start_date, '2026-09-01'::date),
					LEAST(CURRENT_DATE, i.end_date),
					'1 day'::interval
				)::date AS day
			) d
			WHERE EXTRACT(DOW FROM d.day) BETWEEN 1 AND 5
			  AND GREATEST(i.start_date, '2026-09-01'::date) <= LEAST(CURRENT_DATE, i.end_date)
			GROUP BY i.id
		),
		intern_att AS (
			SELECT 
				a.intern_id,
				COUNT(CASE WHEN a.status = 'HADIR' THEN 1 END) AS hadir,
				COUNT(CASE WHEN a.status = 'TERLAMBAT' THEN 1 END) AS terlambat,
				COUNT(CASE WHEN a.status = 'IZIN' THEN 1 END) AS izin,
				COUNT(CASE WHEN a.status = 'ALPHA' THEN 1 END) AS explicit_alpha,
				COUNT(CASE WHEN a.status IN ('HADIR', 'TERLAMBAT', 'IZIN', 'ALPHA') AND EXTRACT(DOW FROM a.attendance_date) BETWEEN 1 AND 5 THEN 1 END) AS attended_working_days
			FROM attendance a
			JOIN interns i ON a.intern_id = i.id
			WHERE a.attendance_date >= GREATEST(i.start_date, '2026-09-01'::date) 
			  AND a.attendance_date <= LEAST(CURRENT_DATE, i.end_date)
			GROUP BY a.intern_id
		)
		SELECT 
			i.id, i.user_id, u.name, u.email, i.university, i.major, i.phone,
			i.supervisor_id, sup.name as supervisor_name,
			i.start_date::text, i.end_date::text, i.status,
			COALESCE(w.total_working_days, 0) AS total_working_days,
			COALESCE(att.hadir, 0) AS hadir,
			COALESCE(att.terlambat, 0) AS terlambat,
			COALESCE(att.izin, 0) AS izin,
			COALESCE(att.explicit_alpha, 0) + GREATEST(0, COALESCE(w.total_working_days, 0) - COALESCE(att.attended_working_days, 0)) AS alpha
		FROM interns i
		JOIN users u ON i.user_id = u.id
		LEFT JOIN users sup ON i.supervisor_id = sup.id
		LEFT JOIN intern_workdays w ON i.id = w.intern_id
		LEFT JOIN intern_att att ON i.id = att.intern_id
		WHERE ($1 = '' OR i.status = $1)
		ORDER BY u.name ASC
	`

	rows, err := r.db.QueryContext(ctx, query, status)
	if err != nil {
		return nil, fmt.Errorf("failed to list all interns: %w", err)
	}
	defer rows.Close()

	var list []model.InternWithUser
	for rows.Next() {
		var iu model.InternWithUser
		var totalDays, hadir, terlambat, izin, alpha int
		if err := rows.Scan(
			&iu.ID, &iu.UserID, &iu.Name, &iu.Email, &iu.University, &iu.Major, &iu.Phone,
			&iu.SupervisorID, &iu.SupervisorName, &iu.StartDate, &iu.EndDate, &iu.Status,
			&totalDays, &hadir, &terlambat, &izin, &alpha,
		); err != nil {
			return nil, fmt.Errorf("failed to scan intern row: %w", err)
		}

		rate := 0.0
		if totalDays > 0 {
			rate = float64(hadir+terlambat) / float64(totalDays) * 100.0
			if rate > 100.0 {
				rate = 100.0
			}
		}

		iu.AttendanceSummary = model.AttendanceSummary{
			Hadir:            hadir,
			Terlambat:        terlambat,
			Izin:             izin,
			Alpha:            alpha,
			TotalWorkingDays: totalDays,
			AttendanceRate:   rate,
		}

		list = append(list, iu)
	}

	return list, nil
}

func (r *internRepository) CreateIntern(ctx context.Context, intern *model.Intern) error {
	query := `
		INSERT INTO interns (id, user_id, university, major, phone, supervisor_id, start_date, end_date, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	if intern.ID == uuid.Nil {
		intern.ID = uuid.New()
	}
	now := time.Now()
	intern.CreatedAt = now
	intern.UpdatedAt = now

	_, err := r.db.ExecContext(
		ctx, query,
		intern.ID, intern.UserID, intern.University, intern.Major, intern.Phone,
		intern.SupervisorID, intern.StartDate, intern.EndDate, intern.Status,
		intern.CreatedAt, intern.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert intern profile: %w", err)
	}
	return nil
}
