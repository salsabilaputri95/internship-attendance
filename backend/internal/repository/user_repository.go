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

type UserRepository interface {
	GetByEmail(ctx context.Context, email string) (*model.User, error)
	GetByID(ctx context.Context, id uuid.UUID) (*model.User, error)
	CreateUser(ctx context.Context, user *model.User) error
	UpdatePassword(ctx context.Context, userID uuid.UUID, passwordHash string) error
}

type userRepository struct {
	db *database.DB
}

func NewUserRepository(db *database.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	query := `
		SELECT id, name, email, password_hash, role, created_at, updated_at
		FROM users
		WHERE LOWER(email) = LOWER($1) OR LOWER(name) = LOWER($1)
		LIMIT 1
	`

	var u model.User
	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return &u, nil
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	query := `
		SELECT id, name, email, password_hash, role, created_at, updated_at
		FROM users
		WHERE id = $1
		LIMIT 1
	`

	var u model.User
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get user by id: %w", err)
	}

	return &u, nil
}

func (r *userRepository) CreateUser(ctx context.Context, user *model.User) error {
	query := `
		INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	if user.ID == uuid.Nil {
		user.ID = uuid.New()
	}
	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	_, err := r.db.ExecContext(
		ctx, query,
		user.ID, user.Name, user.Email, user.PasswordHash, user.Role, user.CreatedAt, user.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert user: %w", err)
	}
	return nil
}

func (r *userRepository) UpdatePassword(ctx context.Context, userID uuid.UUID, passwordHash string) error {
	query := `
		UPDATE users
		SET password_hash = $1, updated_at = $2
		WHERE id = $3
	`
	_, err := r.db.ExecContext(ctx, query, passwordHash, time.Now(), userID)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}
	return nil
}
