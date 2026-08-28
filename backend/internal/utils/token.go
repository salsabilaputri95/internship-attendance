package utils

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"bps-attendance-backend/internal/model"
)

type JWTClaims struct {
	UserID   uuid.UUID  `json:"user_id"`
	Email    string     `json:"email"`
	Role     model.Role `json:"role"`
	InternID *uuid.UUID `json:"intern_id,omitempty"`
	jwt.RegisteredClaims
}

// GenerateToken creates a signed JWT token valid for 24 hours
func GenerateToken(secret string, userID uuid.UUID, email string, role model.Role, internID *uuid.UUID) (string, error) {
	claims := JWTClaims{
		UserID:   userID,
		Email:    email,
		Role:     role,
		InternID: internID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "bps-jeneponto-attendance",
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign JWT: %w", err)
	}

	return signedToken, nil
}

// ValidateToken parses and validates a JWT token string
func ValidateToken(secret string, tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid or expired JWT token")
}
