package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"bps-attendance-backend/internal/middleware"
	"bps-attendance-backend/internal/model"
	"bps-attendance-backend/internal/service"
	"bps-attendance-backend/internal/utils"
)

type AdminHandler struct {
	adminService service.AdminService
}

func NewAdminHandler(adminService service.AdminService) *AdminHandler {
	return &AdminHandler{adminService: adminService}
}

func (h *AdminHandler) GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.adminService.GetDashboardStats(r.Context())
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Gagal memuat statistik Super Admin", err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Statistik Super Admin berhasil dimuat", stats)
}

func (h *AdminHandler) GetAllAttendance(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	search := query.Get("search")
	dateStr := query.Get("date")
	startDate := query.Get("start_date")
	endDate := query.Get("end_date")
	status := query.Get("status")
	category := query.Get("category")

	page, _ := strconv.Atoi(query.Get("page"))
	if page <= 0 {
		page = 1
	}

	limit, _ := strconv.Atoi(query.Get("limit"))
	if limit <= 0 {
		limit = 50
	}

	res, err := h.adminService.GetAllAttendance(r.Context(), search, dateStr, startDate, endDate, status, category, page, limit)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Gagal memuat data presensi", err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Data presensi berhasil dimuat", res)
}

func (h *AdminHandler) GetAttendanceDetail(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	attID, err := uuid.Parse(idStr)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "ID presensi tidak valid", nil)
		return
	}

	res, err := h.adminService.GetAttendanceDetail(r.Context(), attID)
	if err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Detail presensi berhasil dimuat", res)
}

func (h *AdminHandler) CreateAttendance(w http.ResponseWriter, r *http.Request) {
	var req model.AdminCreateAttendanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Format payload tidak valid", err.Error())
		return
	}

	created, err := h.adminService.CreateAttendance(r.Context(), &req)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusCreated, "Data presensi berhasil ditambahkan oleh Super Admin", created)
}

func (h *AdminHandler) UpdateAttendance(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	attID, err := uuid.Parse(idStr)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "ID presensi tidak valid", nil)
		return
	}

	adminID, _ := middleware.GetAuthUserID(r.Context())

	var req model.AdminUpdateAttendanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Format payload tidak valid", err.Error())
		return
	}

	updated, err := h.adminService.UpdateAttendance(r.Context(), attID, adminID, &req)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Data presensi berhasil diperbarui oleh Super Admin", updated)
}

func (h *AdminHandler) DeleteAttendance(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	attID, err := uuid.Parse(idStr)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "ID presensi tidak valid", nil)
		return
	}

	if err := h.adminService.DeleteAttendance(r.Context(), attID); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Data presensi berhasil dihapus", nil)
}

func (h *AdminHandler) GetUsersList(w http.ResponseWriter, r *http.Request) {
	list, err := h.adminService.GetUsersList(r.Context())
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Gagal memuat daftar pengguna", err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Daftar pengguna berhasil dimuat", list)
}
