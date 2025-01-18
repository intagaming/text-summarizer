package handlers

import (
	"bytes"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConvertEpubToHtmlHandler(t *testing.T) {
	tests := []struct {
		name           string
		filePath       string
		expectedStatus int
	}{
		{
			name:           "Valid EPUB file",
			filePath:       "../testdata/sample.epub",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Invalid file type",
			filePath:       "../testdata/invalid.txt",
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a buffer to write our multipart form
			body := &bytes.Buffer{}
			writer := multipart.NewWriter(body)

			// Create form file
			file, err := os.Open(tt.filePath)
			if err != nil {
				t.Fatal(err)
			}
			defer file.Close()

			part, err := writer.CreateFormFile("file", filepath.Base(tt.filePath))
			if err != nil {
				t.Fatal(err)
			}

			_, err = io.Copy(part, file)
			if err != nil {
				t.Fatal(err)
			}

			// Close the multipart writer
			writer.Close()

			// Create request
			req := httptest.NewRequest("POST", "/convertEpubToHtml", body)
			req.Header.Set("Content-Type", writer.FormDataContentType())

			// Create response recorder
			rr := httptest.NewRecorder()

			// Call handler
			ConvertEpubToChaptersHandler(rr, req)

			// Check status code
			assert.Equal(t, tt.expectedStatus, rr.Code)

			// For successful conversions, check HTML content
			if tt.expectedStatus == http.StatusOK {
				assert.Contains(t, rr.Body.String(), "<html>")
			}
		})
	}
}
