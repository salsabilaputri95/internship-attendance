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

type LocationRepository interface {
	GetActiveLocation(ctx context.Context) (*model.Location, error)
	GetAllLocations(ctx context.Context) ([]model.Location, error)
	GetByID(ctx context.Context, id uuid.UUID) (*model.Location, error)
	UpdateLocation(ctx context.Context, loc *model.Location) error
}

type locationRepository struct {
	db *database.DB
}

func NewLocationRepository(db *database.DB) LocationRepository {
	return &locationRepository{db: db}
}

func (r *locationRepository) GetActiveLocation(ctx context.Context) (*model.Location, error) {
	query := `
		SELECT id, name, latitude, longitude, radius, status, created_at, updated_at
		FROM locations
		WHERE status = 'active'
		ORDER BY created_at ASC
		LIMIT 1
	`

	var loc model.Location
	err := r.db.QueryRowContext(ctx, query).Scan(
		&loc.ID, &loc.Name, &loc.Latitude, &loc.Longitude, &loc.Radius, &loc.Status,
		&loc.CreatedAt, &loc.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get active location: %w", err)
	}

	return &loc, nil
}

func (r *locationRepository) GetAllLocations(ctx context.Context) ([]model.Location, error) {
	query := `
		SELECT id, name, latitude, longitude, radius, status, created_at, updated_at
		FROM locations
		ORDER BY created_at ASC
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get all locations: %w", err)
	}
	defer rows.Close()

	var list []model.Location
	for rows.Next() {
		var loc model.Location
		if err := rows.Scan(
			&loc.ID, &loc.Name, &loc.Latitude, &loc.Longitude, &loc.Radius, &loc.Status,
			&loc.CreatedAt, &loc.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan location: %w", err)
		}
		list = append(list, loc)
	}

	return list, nil
}

func (r *locationRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Location, error) {
	query := `
		SELECT id, name, latitude, longitude, radius, status, created_at, updated_at
		FROM locations
		WHERE id = $1
		LIMIT 1
	`

	var loc model.Location
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&loc.ID, &loc.Name, &loc.Latitude, &loc.Longitude, &loc.Radius, &loc.Status,
		&loc.CreatedAt, &loc.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get location by id: %w", err)
	}

	return &loc, nil
}

func (r *locationRepository) UpdateLocation(ctx context.Context, loc *model.Location) error {
	query := `
		UPDATE locations
		SET name = $1, latitude = $2, longitude = $3, radius = $4, status = $5, updated_at = $6
		WHERE id = $7
	`

	loc.UpdatedAt = time.Now()
	res, err := r.db.ExecContext(ctx, query, loc.Name, loc.Latitude, loc.Longitude, loc.Radius, loc.Status, loc.UpdatedAt, loc.ID)
	if err != nil {
		return fmt.Errorf("failed to update location: %w", err)
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		return errors.New("location not found")
	}

	return nil
}
