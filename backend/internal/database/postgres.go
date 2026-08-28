package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"

	"bps-attendance-backend/internal/config"
)

// DB holds the database connection pool
type DB struct {
	*sql.DB
}

// ConnectPostgres initializes and tests a PostgreSQL connection pool
func ConnectPostgres(cfg *config.Config) (*DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBSSLMode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(15 * time.Minute)
	db.SetConnMaxIdleTime(5 * time.Minute)

	// Test connection with retry loop (useful in container startup)
	var pingErr error
	for attempts := 1; attempts <= 15; attempts++ {
		pingErr = db.Ping()
		if pingErr == nil {
			break
		}
		log.Printf("[Database] Waiting for PostgreSQL at %s:%s (attempt %d/15)...", cfg.DBHost, cfg.DBPort, attempts)
		time.Sleep(2 * time.Second)
	}

	if pingErr != nil {
		return nil, fmt.Errorf("failed to ping database after 15 attempts: %w", pingErr)
	}

	log.Printf("[Database] Successfully connected to PostgreSQL (%s:%s/%s)", cfg.DBHost, cfg.DBPort, cfg.DBName)
	return &DB{db}, nil
}
