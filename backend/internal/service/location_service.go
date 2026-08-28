package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"bps-attendance-backend/internal/model"
	"bps-attendance-backend/internal/repository"
)

type UpdateLocationRequest struct {
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Radius    float64 `json:"radius"`
	Status    string  `json:"status"`
}

type LocationService interface {
	GetActiveLocation(ctx context.Context) (*model.Location, error)
	GetAllLocations(ctx context.Context) ([]model.Location, error)
	UpdateLocation(ctx context.Context, id uuid.UUID, req *UpdateLocationRequest) (*model.Location, error)
}

type locationService struct {
	locRepo repository.LocationRepository
}

func NewLocationService(locRepo repository.LocationRepository) LocationService {
	return &locationService{locRepo: locRepo}
}

func (s *locationService) GetActiveLocation(ctx context.Context) (*model.Location, error) {
	return s.locRepo.GetActiveLocation(ctx)
}

func (s *locationService) GetAllLocations(ctx context.Context) ([]model.Location, error) {
	return s.locRepo.GetAllLocations(ctx)
}

func (s *locationService) UpdateLocation(ctx context.Context, id uuid.UUID, req *UpdateLocationRequest) (*model.Location, error) {
	loc, err := s.locRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("error finding location: %w", err)
	}
	if loc == nil {
		return nil, errors.New("location not found")
	}

	if req.Name != "" {
		loc.Name = req.Name
	}
	if req.Latitude != 0 {
		loc.Latitude = req.Latitude
	}
	if req.Longitude != 0 {
		loc.Longitude = req.Longitude
	}
	if req.Radius > 0 {
		loc.Radius = req.Radius
	}
	if req.Status != "" {
		loc.Status = req.Status
	}

	if err := s.locRepo.UpdateLocation(ctx, loc); err != nil {
		return nil, fmt.Errorf("failed to update location: %w", err)
	}

	return loc, nil
}
