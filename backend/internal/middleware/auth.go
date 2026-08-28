package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/google/uuid"

	"bps-attendance-backend/internal/model"
	"bps-attendance-backend/internal/utils"
)

type contextKey string

const (
	UserClaimsKey contextKey = "user_claims"
)

// AuthMiddleware validates JWT Bearer token and sets user claims into request context
func AuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				utils.ErrorResponse(w, http.StatusUnauthorized, "Token autentikasi tidak ditemukan", nil)
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				utils.ErrorResponse(w, http.StatusUnauthorized, "Format token autentikasi tidak valid (gunakan: Bearer <token>)", nil)
				return
			}

			tokenString := parts[1]
			claims, err := utils.ValidateToken(jwtSecret, tokenString)
			if err != nil {
				utils.ErrorResponse(w, http.StatusUnauthorized, "Token tidak valid atau telah kadaluarsa", err.Error())
				return
			}

			// Attach claims to context
			ctx := context.WithValue(r.Context(), UserClaimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole checks if the authenticated user has one of the allowed roles
func RequireRole(allowedRoles ...model.Role) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(UserClaimsKey).(*utils.JWTClaims)
			if !ok || claims == nil {
				utils.ErrorResponse(w, http.StatusUnauthorized, "Sesi pengguna tidak valid", nil)
				return
			}

			roleAllowed := false
			for _, role := range allowedRoles {
				if claims.Role == role || claims.Role == model.RoleAdmin {
					roleAllowed = true
					break
				}
			}

			if !roleAllowed {
				utils.ErrorResponse(w, http.StatusForbidden, "Akses ditolak: Anda tidak memiliki wewenang untuk tindakan ini", nil)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// Helper helpers to get context values
func GetAuthClaims(ctx context.Context) (*utils.JWTClaims, bool) {
	claims, ok := ctx.Value(UserClaimsKey).(*utils.JWTClaims)
	return claims, ok
}

func GetAuthUserID(ctx context.Context) (uuid.UUID, bool) {
	if claims, ok := GetAuthClaims(ctx); ok && claims != nil {
		return claims.UserID, true
	}
	return uuid.Nil, false
}

func GetAuthInternID(ctx context.Context) (*uuid.UUID, bool) {
	if claims, ok := GetAuthClaims(ctx); ok && claims != nil {
		return claims.InternID, true
	}
	return nil, false
}
