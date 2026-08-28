package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

type LocalStorageService struct {
	basePath string
	baseURL  string
}

func NewLocalStorageService(basePath string, baseURL string) (*LocalStorageService, error) {
	// Ensure directory exists
	if err := os.MkdirAll(basePath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create upload directory: %w", err)
	}

	return &LocalStorageService{
		basePath: basePath,
		baseURL:  strings.TrimRight(baseURL, "/"),
	}, nil
}

func (s *LocalStorageService) UploadFile(ctx context.Context, originalName string, contentType string, fileReader io.Reader, size int64) (string, error) {
	// 1. Max size validation (2 MB)
	const maxFileSize = 2 * 1024 * 1024
	if size > maxFileSize {
		return "", errors.New("ukuran file melebihi batas maksimum 2MB")
	}

	// 2. Validate MIME type
	allowedTypes := map[string]string{
		"image/jpeg": ".jpg",
		"image/jpg":  ".jpg",
		"image/png":  ".png",
		"image/webp": ".webp",
	}

	ext, allowed := allowedTypes[strings.ToLower(contentType)]
	if !allowed {
		// Fallback to extension check
		fileExt := strings.ToLower(filepath.Ext(originalName))
		if fileExt == ".jpg" || fileExt == ".jpeg" {
			ext = ".jpg"
		} else if fileExt == ".png" {
			ext = ".png"
		} else if fileExt == ".webp" {
			ext = ".webp"
		} else {
			return "", errors.New("format file tidak didukung, gunakan JPG, PNG, atau WebP")
		}
	}

	// 3. Generate secure random filename
	fileName := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	targetFilePath := filepath.Join(s.basePath, fileName)

	// 4. Create and write file
	dst, err := os.Create(targetFilePath)
	if err != nil {
		return "", fmt.Errorf("gagal membuat file tujuan: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, fileReader); err != nil {
		return "", fmt.Errorf("gagal menulis file ke storage: %w", err)
	}

	// 5. Return accessible URL path
	fileURL := fmt.Sprintf("%s/uploads/%s", s.baseURL, fileName)
	return fileURL, nil
}

func (s *LocalStorageService) DeleteFile(ctx context.Context, fileName string) error {
	filePath := filepath.Join(s.basePath, filepath.Base(fileName))
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func (s *LocalStorageService) GetFileURL(fileName string) string {
	return fmt.Sprintf("%s/uploads/%s", s.baseURL, filepath.Base(fileName))
}
