package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"bps-attendance-backend/internal/config"
	"bps-attendance-backend/internal/database"
	"bps-attendance-backend/internal/handler"
	"bps-attendance-backend/internal/middleware"
	"bps-attendance-backend/internal/model"
	"bps-attendance-backend/internal/repository"
	"bps-attendance-backend/internal/service"
	"bps-attendance-backend/internal/storage"
	"bps-attendance-backend/internal/utils"
)

func main() {
	cfg := config.LoadConfig()

	// 1. Database Connection
	db, err := database.ConnectPostgres(cfg)
	if err != nil {
		log.Fatalf("[Server] Failed to connect to PostgreSQL: %v", err)
	}
	defer db.Close()

	// 2. Storage Service (Local Filesystem Adapter)
	storageService, err := storage.NewLocalStorageService(cfg.LocalStoragePath, cfg.AppBaseURL)
	if err != nil {
		log.Fatalf("[Server] Failed to initialize storage service: %v", err)
	}

	// 3. Repositories
	userRepo := repository.NewUserRepository(db)
	internRepo := repository.NewInternRepository(db)
	locRepo := repository.NewLocationRepository(db)
	attRepo := repository.NewAttendanceRepository(db)
	exportRepo := repository.NewExportRepository(db)

	// 4. Services
	authService := service.NewAuthService(userRepo, internRepo, cfg)
	attService := service.NewAttendanceService(attRepo, locRepo, internRepo, storageService)
	mentorService := service.NewMentorService(attRepo, locRepo, internRepo, userRepo)
	locService := service.NewLocationService(locRepo)

	// 5. Handlers
	authHandler := handler.NewAuthHandler(authService)
	attHandler := handler.NewAttendanceHandler(attService)
	mentorHandler := handler.NewMentorHandler(mentorService)
	locHandler := handler.NewLocationHandler(locService)
	exportHandler := handler.NewExportHandler(exportRepo)

	// Rate Limiters
	loginLimiter := middleware.NewRateLimiter(10, time.Minute)   // 10 login attempts per minute per IP
	uploadLimiter := middleware.NewRateLimiter(30, time.Minute)  // 30 uploads per minute per IP

	// 6. Router Setup
	r := chi.NewRouter()

	// Global Middlewares
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health Check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		dbStatus := "CONNECTED"
		if err := db.Ping(); err != nil {
			dbStatus = "DISCONNECTED"
		}

		utils.SuccessResponse(w, http.StatusOK, "BPS Jeneponto Attendance API is running healthy", map[string]string{
			"status":      "UP",
			"database":    dbStatus,
			"environment": cfg.AppEnv,
		})
	})

	// Serve Static Uploads (Photos)
	fs := http.FileServer(http.Dir(cfg.LocalStoragePath))
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", fs))

	// API Routes Group
	r.Route("/api", func(api chi.Router) {
		// --- PUBLIC AUTH ROUTES (rate-limited) ---
		api.With(loginLimiter.Limit).Post("/auth/login", authHandler.Login)
		api.With(loginLimiter.Limit).Post("/auth/register", authHandler.Register)
		api.With(loginLimiter.Limit).Post("/auth/forgot-password", authHandler.ForgotPassword)
		api.Get("/locations", locHandler.GetActiveLocation)

		// --- PROTECTED ROUTES ---
		api.Group(func(protected chi.Router) {
			protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))

			// User Profile
			protected.Get("/auth/me", authHandler.GetMe)
			protected.Get("/attendance/{id}", attHandler.GetByID)

			// Intern Attendance Routes (Role: intern or admin)
			protected.Group(func(internRoute chi.Router) {
				internRoute.Use(middleware.RequireRole(model.RoleIntern, model.RoleAdmin))

				// Rate-limit photo upload endpoints
				internRoute.With(uploadLimiter.Limit).Post("/attendance/check-in", attHandler.CheckIn)
				internRoute.With(uploadLimiter.Limit).Post("/attendance/check-out", attHandler.CheckOut)
				internRoute.Post("/attendance/leave", attHandler.SubmitLeave)
				internRoute.Get("/attendance/today", attHandler.GetToday)
				internRoute.Get("/attendance/history", attHandler.GetHistory)
			})

			// Mentor & Management Routes (Role: mentor or admin)
			protected.Group(func(mentorRoute chi.Router) {
				mentorRoute.Use(middleware.RequireRole(model.RoleMentor, model.RoleAdmin))

				mentorRoute.Get("/mentor/dashboard", mentorHandler.GetDashboard)
				mentorRoute.Get("/mentor/attendance", mentorHandler.GetAttendanceList)
				mentorRoute.Get("/mentor/attendance/{id}", mentorHandler.GetAttendanceDetail)
				mentorRoute.Post("/mentor/attendance/{id}/correct", mentorHandler.CorrectAttendance)
				mentorRoute.Get("/mentor/interns", mentorHandler.GetInterns)
				mentorRoute.Get("/mentor/interns/{id}/history", mentorHandler.GetInternAttendanceHistory)

				// Export Laporan (CSV)
				mentorRoute.Get("/export/csv", exportHandler.ExportCSV)

				// Location Management
				mentorRoute.Get("/locations/all", locHandler.GetAllLocations)
				mentorRoute.Put("/locations/{id}", locHandler.UpdateLocation)
			})
		})
	})

	serverAddr := fmt.Sprintf(":%s", cfg.AppPort)
	log.Printf("[Server] Starting BPS Jeneponto Backend REST API on port %s...", cfg.AppPort)
	if err := http.ListenAndServe(serverAddr, r); err != nil {
		log.Fatalf("[Server] Fatal error starting server: %v", err)
	}
}
