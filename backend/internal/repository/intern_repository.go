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
		SELECT 
			i.id, i.user_id, u.name, u.email, i.university, i.major, i.phone,
			i.supervisor_id, sup.name as supervisor_name,
			i.start_date::text, i.end_date::text, i.status
		FROM interns i
		JOIN users u ON i.user_id = u.id
		LEFT JOIN users sup ON i.supervisor_id = sup.id
		WHERE i.id = $1
		LIMIT 1
	`

	var iu model.InternWithUser
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&iu.ID, &iu.UserID, &iu.Name, &iu.Email, &iu.University, &iu.Major, &iu.Phone,
		&iu.SupervisorID, &iu.SupervisorName, &iu.StartDate, &iu.EndDate, &iu.Status,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get intern with user details: %w", err)
	}

	return &iu, nil
}

func (r *internRepository) ListAllInterns(ctx context.Context, status string) ([]model.InternWithUser, error) {
	query := `
		SELECT 
			i.id, i.user_id, u.name, u.email, i.university, i.major, i.phone,
			i.supervisor_id, sup.name as supervisor_name,
			i.start_date::text, i.end_date::text, i.status
		FROM interns i
		JOIN users u ON i.user_id = u.id
		LEFT JOIN users sup ON i.supervisor_id = sup.id
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
		if err := rows.Scan(
			&iu.ID, &iu.UserID, &iu.Name, &iu.Email, &iu.University, &iu.Major, &iu.Phone,
			&iu.SupervisorID, &iu.SupervisorName, &iu.StartDate, &iu.EndDate, &iu.Status,
		); err != nil {
			return nil, fmt.Errorf("failed to scan intern row: %w", err)
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
