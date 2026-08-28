package repository

import (
	"context"
	"fmt"
	"time"

	"bps-attendance-backend/internal/database"
)

// ExportRow represents a flat row for CSV/Excel export.
type ExportRow struct {
	InternName       string
	InternUniversity string
	InternMajor      string
	AttendanceDate   string
	Status           string
	CheckIn          *time.Time
	CheckOut         *time.Time
	CheckInDistance  *float64
	CheckOutDistance *float64
	Notes            *string
}

// ExportRepository handles queries for the export feature.
type ExportRepository interface {
	GetExportData(ctx context.Context, internID *string, startDate, endDate string) ([]ExportRow, error)
}

type exportRepository struct {
	db *database.DB
}

func NewExportRepository(db *database.DB) ExportRepository {
	return &exportRepository{db: db}
}

func (r *exportRepository) GetExportData(ctx context.Context, internID *string, startDate, endDate string) ([]ExportRow, error) {
	var query string
	var args []interface{}

	baseQuery := `
		SELECT
			u.name,
			i.university,
			i.major,
			a.attendance_date::text,
			a.status,
			a.check_in,
			a.check_out,
			a.check_in_distance,
			a.check_out_distance,
			a.notes
		FROM attendance a
		JOIN interns i ON a.intern_id = i.id
		JOIN users u ON i.user_id = u.id
		WHERE a.attendance_date BETWEEN $1::date AND $2::date
	`

	if internID != nil && *internID != "" {
		query = baseQuery + " AND i.id = $3 ORDER BY a.attendance_date ASC, u.name ASC"
		args = []interface{}{startDate, endDate, *internID}
	} else {
		query = baseQuery + " ORDER BY a.attendance_date ASC, u.name ASC"
		args = []interface{}{startDate, endDate}
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query export data: %w", err)
	}
	defer rows.Close()

	var list []ExportRow
	for rows.Next() {
		var row ExportRow
		if err := rows.Scan(
			&row.InternName, &row.InternUniversity, &row.InternMajor,
			&row.AttendanceDate, &row.Status,
			&row.CheckIn, &row.CheckOut,
			&row.CheckInDistance, &row.CheckOutDistance,
			&row.Notes,
		); err != nil {
			return nil, fmt.Errorf("failed to scan export row: %w", err)
		}
		list = append(list, row)
	}

	return list, nil
}
