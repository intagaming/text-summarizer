package handlers

import (
	"bytes"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
)

func ConvertEpubToMdHandler(w http.ResponseWriter, r *http.Request) {
	// Set maximum upload size
	const maxUploadSize = 10 << 20 // 10 MB
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

	// Parse multipart form
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		http.Error(w, "File too large", http.StatusBadRequest)
		return
	}

	// Get file from form
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Invalid file upload", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file extension
	if !strings.HasSuffix(header.Filename, ".epub") {
		http.Error(w, "Invalid file type, only .epub files are allowed", http.StatusBadRequest)
		return
	}

	// Create temporary file
	tempFile, err := os.CreateTemp("", "upload-*.epub")
	if err != nil {
		log.Printf("Error creating temp file: %v\n", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer os.Remove(tempFile.Name())

	// Copy file content to temp file
	if _, err := io.Copy(tempFile, file); err != nil {
		log.Printf("Error copying file: %v\n", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Convert EPUB to Markdown using Pandoc
	var out bytes.Buffer
	cmd := exec.Command("pandoc", "-f", "epub", "-t", "markdown", tempFile.Name())
	cmd.Stdout = &out
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		log.Printf("Pandoc conversion error: %v\n", err)
		http.Error(w, "Failed to convert file", http.StatusInternalServerError)
		return
	}

	// Return converted content
	w.Header().Set("Content-Type", "text/markdown")
	w.WriteHeader(http.StatusOK)
	w.Write(out.Bytes())
}
