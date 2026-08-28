package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"bps-attendance-backend/internal/service"
	"bps-attendance-backend/internal/utils"
)

type LocationHandler struct {
	locService service.LocationService
}

func NewLocationHandler(locService service.LocationService) *LocationHandler {
	return &LocationHandler{locService: locService}
}

func (h *LocationHandler) GetActiveLocation(w http.ResponseWriter, r *http.Request) {
	loc, err := h.locService.GetActiveLocation(r.Context())
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	if loc == nil {
		utils.ErrorResponse(w, http.StatusNotFound, "Lokasi kantor belum dikonfigurasi", nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Lokasi aktif berhasil dimuat", loc)
}

func (h *LocationHandler) GetAllLocations(w http.ResponseWriter, r *http.Request) {
	locs, err := h.locService.GetAllLocations(r.Context())
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Daftar lokasi berhasil dimuat", locs)
}

func (h *LocationHandler) UpdateLocation(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	locID, err := uuid.Parse(idParam)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "ID lokasi tidak valid", nil)
		return
	}

	var req service.UpdateLocationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Payload tidak valid", err.Error())
		return
	}

	updated, err := h.locService.UpdateLocation(r.Context(), locID, &req)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	utils.SuccessResponse(w, http.StatusOK, "Konfigurasi lokasi dan radius kantor berhasil diperbarui", updated)
}
