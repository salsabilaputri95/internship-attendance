package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"bps-attendance-backend/internal/middleware"
	"bps-attendance-backend/internal/service"
	"bps-attendance-backend/internal/utils"
)

type MentorHandler struct {
	mentorService service.MentorService
}

func NewMentorHandler(mentorService service.MentorService) *MentorHandler {
	return &MentorHandler{mentorService: mentorService}
}

func (h *MentorHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	dateParam := r.URL.Query().Get("date")

	dashboardData, err := h.mentorService.GetDashboard(r.Context(), dateParam)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Dashboard mentor berhasil dimuat", dashboardData)
}

func (h *MentorHandler) GetAttendanceList(w http.ResponseWriter, r *http.Request) {
	dateParam := r.URL.Query().Get("date")
	search := r.URL.Query().Get("search")
	status := r.URL.Query().Get("status")

	list, err := h.mentorService.GetAttendanceList(r.Context(), dateParam, search, status)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Daftar kehadiran berhasil dimuat", list)
}

func (h *MentorHandler) GetAttendanceDetail(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	attID, err := uuid.Parse(idParam)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "ID absensi tidak valid", nil)
		return
	}

	detail, err := h.mentorService.GetAttendanceDetailWithLogs(r.Context(), attID)
	if err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Detail kehadiran dan riwayat audit berhasil dimuat", detail)
}

func (h *MentorHandler) CorrectAttendance(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	attID, err := uuid.Parse(idParam)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "ID absensi tidak valid", nil)
		return
	}

	mentorID, ok := middleware.GetAuthUserID(r.Context())
	if !ok {
		utils.ErrorResponse(w, http.StatusUnauthorized, "Sesi mentor tidak valid", nil)
		return
	}

	var req service.CorrectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Payload koreksi tidak valid", err.Error())
		return
	}

	updated, err := h.mentorService.CorrectAttendance(r.Context(), attID, mentorID, &req)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Koreksi absensi berhasil disimpan ke Audit Log", updated)
}

func (h *MentorHandler) GetInterns(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")

	interns, err := h.mentorService.GetInterns(r.Context(), status)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Daftar peserta magang berhasil dimuat", interns)
}
