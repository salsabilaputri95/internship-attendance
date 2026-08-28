package utils

import (
	"encoding/json"
	"net/http"
)

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   interface{} `json:"error,omitempty"`
}

func JSONResponse(w http.ResponseWriter, statusCode int, success bool, message string, data interface{}, err interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	resp := APIResponse{
		Success: success,
		Message: message,
		Data:    data,
		Error:   err,
	}

	_ = json.NewEncoder(w).Encode(resp)
}

func SuccessResponse(w http.ResponseWriter, statusCode int, message string, data interface{}) {
	JSONResponse(w, statusCode, true, message, data, nil)
}

func ErrorResponse(w http.ResponseWriter, statusCode int, message string, err interface{}) {
	JSONResponse(w, statusCode, false, message, nil, err)
}
