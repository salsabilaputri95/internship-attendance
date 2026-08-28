package handler

import (
	"encoding/json"
	"net/http"

	"bps-attendance-backend/internal/middleware"
	"bps-attendance-backend/internal/service"
	"bps-attendance-backend/internal/utils"
)

type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req service.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	res, err := h.authService.Login(r.Context(), &req)
	if err != nil {
		utils.ErrorResponse(w, http.StatusUnauthorized, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Login berhasil", res)
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req service.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Format payload tidak valid", err.Error())
		return
	}

	res, err := h.authService.RegisterIntern(r.Context(), &req)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusCreated, "Pendaftaran akun peserta magang berhasil", res)
}

func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req service.ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Format payload tidak valid", err.Error())
		return
	}

	if err := h.authService.ResetPassword(r.Context(), &req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Kata sandi Anda berhasil diperbarui. Silakan login kembali.", nil)
}

func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetAuthUserID(r.Context())
	if !ok {
		utils.ErrorResponse(w, http.StatusUnauthorized, "Sesi tidak valid", nil)
		return
	}

	profile, err := h.authService.GetMe(r.Context(), userID)
	if err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Berhasil mengambil data profil", profile)
}
