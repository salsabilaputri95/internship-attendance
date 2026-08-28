package handler

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strings"
	"time"

	"bps-attendance-backend/internal/repository"
	"bps-attendance-backend/internal/utils"
)

type ExportHandler struct {
	exportRepo repository.ExportRepository
}

func NewExportHandler(exportRepo repository.ExportRepository) *ExportHandler {
	return &ExportHandler{exportRepo: exportRepo}
}

// ExportCSV streams a CSV download of attendance records for a date range.
// Query params: start_date (YYYY-MM-DD), end_date (YYYY-MM-DD), intern_id (optional UUID)
func (h *ExportHandler) ExportCSV(w http.ResponseWriter, r *http.Request) {
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")
	internIDParam := r.URL.Query().Get("intern_id")

	// Default to current month if not provided
	now := time.Now()
	if startDate == "" {
		startDate = fmt.Sprintf("%d-%02d-01", now.Year(), now.Month())
	}
	if endDate == "" {
		endDate = now.Format("2006-01-02")
	}

	// Validate date format
	if _, err := time.Parse("2006-01-02", startDate); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Format start_date tidak valid (gunakan YYYY-MM-DD)", nil)
		return
	}
	if _, err := time.Parse("2006-01-02", endDate); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Format end_date tidak valid (gunakan YYYY-MM-DD)", nil)
		return
	}

	var internIDPtr *string
	if internIDParam != "" {
		internIDPtr = &internIDParam
	}

	rows, err := h.exportRepo.GetExportData(r.Context(), internIDPtr, startDate, endDate)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Gagal mengambil data untuk export: "+err.Error(), nil)
		return
	}

	filename := fmt.Sprintf("presensi-magang-bps-jeneponto_%s_sd_%s.csv", startDate, endDate)

	// Stream CSV response
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")

	// Write UTF-8 BOM for Excel compatibility
	w.Write([]byte("\xEF\xBB\xBF"))

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// CSV Header row
	writer.Write([]string{
		"Nama Peserta",
		"Universitas",
		"Jurusan / Program Studi",
		"Tanggal",
		"Status Kehadiran",
		"Jam Masuk (WITA)",
		"Jam Pulang (WITA)",
		"Jarak Masuk (meter)",
		"Jarak Pulang (meter)",
		"Catatan",
	})

	for _, row := range rows {
		checkInStr := ""
		if row.CheckIn != nil {
			checkInStr = row.CheckIn.Format("15:04:05")
		}

		checkOutStr := ""
		if row.CheckOut != nil {
			checkOutStr = row.CheckOut.Format("15:04:05")
		}

		checkInDistStr := ""
		if row.CheckInDistance != nil {
			checkInDistStr = fmt.Sprintf("%.1f", *row.CheckInDistance)
		}

		checkOutDistStr := ""
		if row.CheckOutDistance != nil {
			checkOutDistStr = fmt.Sprintf("%.1f", *row.CheckOutDistance)
		}

		notesStr := ""
		if row.Notes != nil {
			notesStr = strings.TrimSpace(*row.Notes)
		}

		writer.Write([]string{
			row.InternName,
			row.InternUniversity,
			row.InternMajor,
			row.AttendanceDate,
			string(row.Status),
			checkInStr,
			checkOutStr,
			checkInDistStr,
			checkOutDistStr,
			notesStr,
		})
	}
}
