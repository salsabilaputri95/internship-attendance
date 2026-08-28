package storage

import (
	"context"
	"io"
)

// StorageService defines contract for saving and retrieving photos
type StorageService interface {
	UploadFile(ctx context.Context, fileName string, contentType string, fileReader io.Reader, size int64) (string, error)
	DeleteFile(ctx context.Context, fileName string) error
	GetFileURL(fileName string) string
}
