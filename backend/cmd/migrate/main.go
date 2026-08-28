package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"

	"bps-attendance-backend/internal/config"
	"bps-attendance-backend/internal/database"
)

func main() {
	cmd := flag.String("action", "up", "Migration action: up, down, seed, fresh")
	flag.Parse()

	if len(flag.Args()) > 0 {
		*cmd = flag.Args()[0]
	}

	cfg := config.LoadConfig()

	// Ensure database exists before proceeding
	ensureDatabaseExists(cfg)

	db, err := database.ConnectPostgres(cfg)
	if err != nil {
		log.Fatalf("[Migrate] Failed to connect to database %s: %v", cfg.DBName, err)
	}
	defer db.Close()

	migrationsDir := findMigrationsDir()

	switch *cmd {
	case "up":
		runSQLFile(db, filepath.Join(migrationsDir, "000001_create_schema.up.sql"), "Creating Schema (UP)")
	case "down":
		runSQLFile(db, filepath.Join(migrationsDir, "000001_create_schema.down.sql"), "Dropping Schema (DOWN)")
	case "seed":
		seedData(db, migrationsDir)
	case "fresh":
		runSQLFile(db, filepath.Join(migrationsDir, "000001_create_schema.down.sql"), "Dropping Schema (DOWN)")
		runSQLFile(db, filepath.Join(migrationsDir, "000001_create_schema.up.sql"), "Creating Schema (UP)")
		seedData(db, migrationsDir)
	default:
		log.Fatalf("[Migrate] Unknown action: %s. Use 'up', 'down', 'seed', or 'fresh'", *cmd)
	}

	log.Printf("[Migrate] Action '%s' executed successfully!", *cmd)
}

func seedData(db *database.DB, migrationsDir string) {
	log.Printf("[Migrate] Seeding Initial Data with dynamic Bcrypt password hash...")
	
	// Generate guaranteed valid bcrypt hash for "password123"
	hash, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("[Migrate] Failed to generate password hash: %v", err)
	}

	seedFilePath := filepath.Join(migrationsDir, "000002_seed_initial_data.sql")
	content, err := os.ReadFile(seedFilePath)
	if err != nil {
		log.Fatalf("[Migrate] Error reading seed file %s: %v", seedFilePath, err)
	}

	sqlScript := strings.ReplaceAll(string(content), "{{BCRYPT_PASSWORD_HASH}}", string(hash))

	_, err = db.Exec(sqlScript)
	if err != nil {
		log.Fatalf("[Migrate] Error executing seed file %s: %v", seedFilePath, err)
	}
	fmt.Printf("✓ Seeding Initial Data completed successfully.\n")
}

func ensureDatabaseExists(cfg *config.Config) {
	adminDSN := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=postgres sslmode=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBSSLMode,
	)

	adminDB, err := sql.Open("postgres", adminDSN)
	if err != nil {
		log.Printf("[Migrate] Warning: Could not connect to default postgres db: %v", err)
		return
	}
	defer adminDB.Close()

	if err := adminDB.Ping(); err != nil {
		log.Printf("[Migrate] Warning: Could not ping default postgres db: %v", err)
		return
	}

	var exists bool
	query := fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = '%s')", cfg.DBName)
	if err := adminDB.QueryRow(query).Scan(&exists); err != nil {
		log.Printf("[Migrate] Error checking database existence: %v", err)
		return
	}

	if !exists {
		log.Printf("[Migrate] Database '%s' does not exist. Creating now...", cfg.DBName)
		_, err = adminDB.Exec(fmt.Sprintf("CREATE DATABASE \"%s\"", cfg.DBName))
		if err != nil {
			log.Fatalf("[Migrate] Failed to create database '%s': %v", cfg.DBName, err)
		}
		log.Printf("[Migrate] Database '%s' created successfully.", cfg.DBName)
	}
}

func findMigrationsDir() string {
	candidates := []string{
		"migrations",
		"backend/migrations",
		"../migrations",
		"../../migrations",
	}

	for _, dir := range candidates {
		if _, err := os.Stat(dir); err == nil {
			return dir
		}
	}
	return "migrations"
}

func runSQLFile(db *database.DB, filePath string, description string) {
	log.Printf("[Migrate] Running: %s (%s)...", description, filePath)
	content, err := os.ReadFile(filePath)
	if err != nil {
		log.Fatalf("[Migrate] Error reading SQL file %s: %v", filePath, err)
	}

	_, err = db.Exec(string(content))
	if err != nil {
		log.Fatalf("[Migrate] Error executing SQL file %s: %v", filePath, err)
	}
	fmt.Printf("✓ %s completed successfully.\n", description)
}
