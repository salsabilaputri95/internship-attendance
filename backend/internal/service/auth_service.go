package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"bps-attendance-backend/internal/config"
	"bps-attendance-backend/internal/model"
	"bps-attendance-backend/internal/repository"
	"bps-attendance-backend/internal/utils"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string                    `json:"token"`
	User  model.UserProfileResponse `json:"user"`
}

type RegisterRequest struct {
	Name        string `json:"name"`
	Email       string `json:"email"`
	Password    string `json:"password"`
	University  string `json:"university"`
	Major       string `json:"major"`
	Phone       string `json:"phone"`
	StartDate   string `json:"start_date"` // YYYY-MM-DD
	EndDate     string `json:"end_date"`   // YYYY-MM-DD
}

type ForgotPasswordRequest struct {
	Email       string `json:"email"`
	NewPassword string `json:"new_password"`
}

type AuthService interface {
	Login(ctx context.Context, req *LoginRequest) (*LoginResponse, error)
	GetMe(ctx context.Context, userID uuid.UUID) (*model.UserProfileResponse, error)
	RegisterIntern(ctx context.Context, req *RegisterRequest) (*LoginResponse, error)
	ResetPassword(ctx context.Context, req *ForgotPasswordRequest) error
}

type authService struct {
	userRepo   repository.UserRepository
	internRepo repository.InternRepository
	cfg        *config.Config
}

func NewAuthService(userRepo repository.UserRepository, internRepo repository.InternRepository, cfg *config.Config) AuthService {
	return &authService{
		userRepo:   userRepo,
		internRepo: internRepo,
		cfg:        cfg,
	}
}

func (s *authService) Login(ctx context.Context, req *LoginRequest) (*LoginResponse, error) {
	if req.Email == "" || req.Password == "" {
		return nil, errors.New("email dan password wajib diisi")
	}

	user, err := s.userRepo.GetByEmail(ctx, strings.TrimSpace(req.Email))
	if err != nil {
		return nil, fmt.Errorf("error finding user: %w", err)
	}
	if user == nil {
		return nil, errors.New("email atau password tidak valid")
	}

	// Verify bcrypt hash
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("email atau password tidak valid")
	}

	var internID *uuid.UUID
	if user.Role == model.RoleIntern {
		intern, err := s.internRepo.GetByUserID(ctx, user.ID)
		if err != nil {
			return nil, fmt.Errorf("error finding intern record: %w", err)
		}
		if intern != nil {
			internID = &intern.ID
		}
	}

	token, err := utils.GenerateToken(s.cfg.JWTSecret, user.ID, user.Email, user.Role, internID)
	if err != nil {
		return nil, fmt.Errorf("error generating auth token: %w", err)
	}

	return &LoginResponse{
		Token: token,
		User: model.UserProfileResponse{
			ID:        user.ID,
			Name:      user.Name,
			Email:     user.Email,
			Role:      user.Role,
			InternID:  internID,
			CreatedAt: user.CreatedAt,
		},
	}, nil
}

func (s *authService) GetMe(ctx context.Context, userID uuid.UUID) (*model.UserProfileResponse, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("error retrieving user: %w", err)
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	var internID *uuid.UUID
	if user.Role == model.RoleIntern {
		intern, err := s.internRepo.GetByUserID(ctx, user.ID)
		if err == nil && intern != nil {
			internID = &intern.ID
		}
	}

	return &model.UserProfileResponse{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Role:      user.Role,
		InternID:  internID,
		CreatedAt: user.CreatedAt,
	}, nil
}

func (s *authService) RegisterIntern(ctx context.Context, req *RegisterRequest) (*LoginResponse, error) {
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Name = strings.TrimSpace(req.Name)
	req.University = strings.TrimSpace(req.University)
	req.Major = strings.TrimSpace(req.Major)

	if req.Email == "" || req.Password == "" || req.Name == "" || req.University == "" || req.Major == "" {
		return nil, errors.New("nama, email, password, universitas, dan jurusan wajib diisi")
	}

	if len(req.Password) < 6 {
		return nil, errors.New("kata sandi minimal 6 karakter")
	}

	// Check if email already registered
	existing, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("error checking existing user: %w", err)
	}
	if existing != nil {
		return nil, errors.New("alamat email sudah terdaftar di sistem")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("gagal mengenkripsi kata sandi: %w", err)
	}

	// 1. Create User
	userID := uuid.New()
	newUser := &model.User{
		ID:           userID,
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Role:         model.RoleIntern,
	}

	if err := s.userRepo.CreateUser(ctx, newUser); err != nil {
		return nil, fmt.Errorf("gagal membuat akun pengguna: %w", err)
	}

	// 2. Create Intern Profile
	startDate := req.StartDate
	if startDate == "" {
		startDate = "2026-08-10"
	}
	endDate := req.EndDate
	if endDate == "" {
		endDate = "2027-02-09"
	}

	internID := uuid.New()
	phonePtr := &req.Phone
	if req.Phone == "" {
		phonePtr = nil
	}

	newIntern := &model.Intern{
		ID:         internID,
		UserID:     userID,
		University: req.University,
		Major:      req.Major,
		Phone:      phonePtr,
		StartDate:  startDate,
		EndDate:    endDate,
		Status:     model.InternStatusActive,
	}

	if err := s.internRepo.CreateIntern(ctx, newIntern); err != nil {
		return nil, fmt.Errorf("gagal menyimpan profil peserta magang: %w", err)
	}

	// Generate JWT Token for immediate login
	token, err := utils.GenerateToken(s.cfg.JWTSecret, userID, newUser.Email, newUser.Role, &internID)
	if err != nil {
		return nil, fmt.Errorf("akun terdaftar namun gagal membuat token sesi: %w", err)
	}

	return &LoginResponse{
		Token: token,
		User: model.UserProfileResponse{
			ID:        userID,
			Name:      newUser.Name,
			Email:     newUser.Email,
			Role:      newUser.Role,
			InternID:  &internID,
			CreatedAt: newUser.CreatedAt,
		},
	}, nil
}

func (s *authService) ResetPassword(ctx context.Context, req *ForgotPasswordRequest) error {
	email := strings.TrimSpace(strings.ToLower(req.Email))
	if email == "" || req.NewPassword == "" {
		return errors.New("email dan kata sandi baru wajib diisi")
	}

	if len(req.NewPassword) < 6 {
		return errors.New("kata sandi baru minimal 6 karakter")
	}

	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return fmt.Errorf("error verifying user: %w", err)
	}
	if user == nil {
		return errors.New("alamat email tidak ditemukan dalam sistem")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("gagal mengenkripsi kata sandi: %w", err)
	}

	if err := s.userRepo.UpdatePassword(ctx, user.ID, string(hashedPassword)); err != nil {
		return fmt.Errorf("gagal memperbarui kata sandi: %w", err)
	}

	return nil
}
