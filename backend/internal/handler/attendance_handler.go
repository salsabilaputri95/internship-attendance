package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"bps-attendance-backend/internal/middleware"
	"bps-attendance-backend/internal/service"
	"bps-attendance-backend/internal/utils"
)

type AttendanceHandler struct {
	attService service.AttendanceService
}

func NewAttendanceHandler(attService service.AttendanceService) *AttendanceHandler {
	return &AttendanceHandler{attService: attService}
}

func (h *AttendanceHandler) CheckIn(w http.ResponseWriter, r *http.Request) {
	internID, ok := middleware.GetAuthInternID(r.Context())
	if !ok || internID == nil {
		utils.ErrorResponse(w, http.StatusForbidden, "Akses hanya untuk akun peserta magang aktif", nil)
		return
	}

	// Parse multipart form with max 10MB memory limit
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Gagal memproses form-data", err.Error())
		return
	}

	latStr := r.FormValue("latitude")
	lonStr := r.FormValue("longitude")
	accStr := r.FormValue("accuracy")
	notes := r.FormValue("notes")

	latitude, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Koordinat latitude tidak valid", nil)
		return
	}

	longitude, err := strconv.ParseFloat(lonStr, 64)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Koordinat longitude tidak valid", nil)
		return
	}

	accuracy, _ := strconv.ParseFloat(accStr, 64)

	// Photo file (optional / disabled requirement)
	var photoName, photoType string
	var photoSize int64
	var fileReader io.Reader

	file, fileHeader, err := r.FormFile("photo")
	if err == nil {
		defer file.Close()
		fileReader = file
		photoName = fileHeader.Filename
		photoType = fileHeader.Header.Get("Content-Type")
		photoSize = fileHeader.Size
	}

	req := &service.CheckInRequest{
		InternID:    *internID,
		Latitude:    latitude,
		Longitude:   longitude,
		Accuracy:    accuracy,
		Notes:       notes,
		PhotoReader: fileReader,
		PhotoName:   photoName,
		PhotoType:   photoType,
		PhotoSize:   photoSize,
	}

	att, err := h.attService.CheckIn(r.Context(), req)
	if err != nil {
		utils.ErrorResponse(w, http.StatusUnprocessableEntity, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Absen masuk berhasil dicatat", att)
}

func (h *AttendanceHandler) CheckOut(w http.ResponseWriter, r *http.Request) {
	internID, ok := middleware.GetAuthInternID(r.Context())
	if !ok || internID == nil {
		utils.ErrorResponse(w, http.StatusForbidden, "Akses hanya untuk akun peserta magang aktif", nil)
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Gagal memproses form-data", err.Error())
		return
	}

	latStr := r.FormValue("latitude")
	lonStr := r.FormValue("longitude")
	accStr := r.FormValue("accuracy")
	notes := r.FormValue("notes")

	latitude, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Koordinat latitude tidak valid", nil)
		return
	}

	longitude, err := strconv.ParseFloat(lonStr, 64)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Koordinat longitude tidak valid", nil)
		return
	}

	accuracy, _ := strconv.ParseFloat(accStr, 64)

	// Photo file (optional / disabled requirement)
	var photoName, photoType string
	var photoSize int64
	var fileReader io.Reader

	file, fileHeader, err := r.FormFile("photo")
	if err == nil {
		defer file.Close()
		fileReader = file
		photoName = fileHeader.Filename
		photoType = fileHeader.Header.Get("Content-Type")
		photoSize = fileHeader.Size
	}

	req := &service.CheckOutRequest{
		InternID:    *internID,
		Latitude:    latitude,
		Longitude:   longitude,
		Accuracy:    accuracy,
		Notes:       notes,
		PhotoReader: fileReader,
		PhotoName:   photoName,
		PhotoType:   photoType,
		PhotoSize:   photoSize,
	}

	att, err := h.attService.CheckOut(r.Context(), req)
	if err != nil {
		utils.ErrorResponse(w, http.StatusUnprocessableEntity, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Absen pulang berhasil dicatat", att)
}

func (h *AttendanceHandler) SubmitLeave(w http.ResponseWriter, r *http.Request) {
	internID, ok := middleware.GetAuthInternID(r.Context())
	if !ok || internID == nil {
		utils.ErrorResponse(w, http.StatusForbidden, "Akses hanya untuk akun peserta magang", nil)
		return
	}

	var req service.LeaveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Format payload pengajuan izin tidak valid", err.Error())
		return
	}

	req.InternID = *internID
	att, err := h.attService.SubmitLeave(r.Context(), &req)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Pengajuan izin berhasil dicatat", att)
}

func (h *AttendanceHandler) GetToday(w http.ResponseWriter, r *http.Request) {
	internID, ok := middleware.GetAuthInternID(r.Context())
	if !ok || internID == nil {
		utils.ErrorResponse(w, http.StatusForbidden, "Akses hanya untuk akun peserta magang", nil)
		return
	}

	todayData, err := h.attService.GetToday(r.Context(), *internID)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Data kehadiran hari ini berhasil dimuat", todayData)
}

func (h *AttendanceHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	internID, ok := middleware.GetAuthInternID(r.Context())
	if !ok || internID == nil {
		utils.ErrorResponse(w, http.StatusForbidden, "Akses hanya untuk akun peserta magang", nil)
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	history, summary, err := h.attService.GetHistory(r.Context(), *internID, limit, offset)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Riwayat kehadiran berhasil dimuat", map[string]interface{}{
		"history": history,
		"summary": summary,
	})
}

func (h *AttendanceHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	attID, err := uuid.Parse(idParam)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "ID absensi tidak valid", nil)
		return
	}

	detail, err := h.attService.GetByID(r.Context(), attID)
	if err != nil {
		utils.ErrorResponse(w, http.StatusNotFound, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Detail absensi berhasil dimuat", detail)
}
