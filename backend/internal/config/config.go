package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort       string
	AppEnv        string
	DBHost        string
	DBPort        string
	DBUser        string
	DBPassword    string
	DBName        string
	DBSSLMode     string
	JWTSecret     string
	StorageDriver string
	LocalStoragePath string
	AppBaseURL    string
}

func LoadConfig() *Config {
	// Load .env if present
	if err := godotenv.Load(); err != nil {
		log.Println("[Config] No .env file found or error reading, using system env variables")
	}

	return &Config{
		AppPort:          getEnv("APP_PORT", "8080"),
		AppEnv:           getEnv("APP_ENV", "development"),
		DBHost:           getEnv("DB_HOST", "localhost"),
		DBPort:           getEnv("DB_PORT", "5432"),
		DBUser:           getEnv("DB_USER", "postgres"),
		DBPassword:       getEnv("DB_PASSWORD", "postgres"),
		DBName:           getEnv("DB_NAME", "bps_attendance"),
		DBSSLMode:        getEnv("DB_SSLMODE", "disable"),
		JWTSecret:        getEnv("JWT_SECRET", "super-secret-jwt-key-bps-jeneponto-2026"),
		StorageDriver:    getEnv("STORAGE_DRIVER", "local"),
		LocalStoragePath: getEnv("LOCAL_STORAGE_PATH", "./uploads"),
		AppBaseURL:       getEnv("APP_BASE_URL", "http://localhost:8080"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}
