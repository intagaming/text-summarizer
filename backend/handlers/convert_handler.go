package handlers

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"encoding/xml"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type container struct {
	RootFiles []rootFile `xml:"rootfiles>rootfile"`
}

type rootFile struct {
	FullPath  string `xml:"full-path,attr"`
	MediaType string `xml:"media-type,attr"`
}

type packageDoc struct {
	Manifest manifest `xml:"manifest"`
	Spine    spine    `xml:"spine"`
}

type manifest struct {
	Items []item `xml:"item"`
}

type item struct {
	ID        string `xml:"id,attr"`
	Href      string `xml:"href,attr"`
	MediaType string `xml:"media-type,attr"`
}

type spine struct {
	ItemRefs []itemRef `xml:"itemref"`
}

type itemRef struct {
	IDRef string `xml:"idref,attr"`
}

func ConvertEpubToChaptersHandler(w http.ResponseWriter, r *http.Request) {
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

	// Open EPUB as zip archive
	reader, err := zip.OpenReader(tempFile.Name())
	if err != nil {
		log.Printf("Error opening EPUB file: %v\n", err)
		http.Error(w, "Invalid EPUB file", http.StatusBadRequest)
		return
	}
	defer reader.Close()

	// Find and parse container.xml
	var containerFile *zip.File
	for _, f := range reader.File {
		if f.Name == "META-INF/container.xml" {
			containerFile = f
			break
		}
	}

	if containerFile == nil {
		http.Error(w, "EPUB container.xml not found", http.StatusBadRequest)
		return
	}

	containerContent, err := containerFile.Open()
	if err != nil {
		log.Printf("Error reading container.xml: %v\n", err)
		http.Error(w, "Error reading EPUB metadata", http.StatusInternalServerError)
		return
	}
	defer containerContent.Close()

	var containerXML container
	if err := xml.NewDecoder(containerContent).Decode(&containerXML); err != nil {
		log.Printf("Error parsing container.xml: %v\n", err)
		http.Error(w, "Error parsing EPUB metadata", http.StatusInternalServerError)
		return
	}

	if len(containerXML.RootFiles) == 0 {
		http.Error(w, "No root file found in EPUB", http.StatusBadRequest)
		return
	}

	// Find and parse root file
	rootFilePath := containerXML.RootFiles[0].FullPath
	var rootFile *zip.File
	for _, f := range reader.File {
		if f.Name == rootFilePath {
			rootFile = f
			break
		}
	}

	if rootFile == nil {
		http.Error(w, "EPUB root file not found", http.StatusBadRequest)
		return
	}

	rootContent, err := rootFile.Open()
	if err != nil {
		log.Printf("Error reading root file: %v\n", err)
		http.Error(w, "Error reading EPUB content", http.StatusInternalServerError)
		return
	}
	defer rootContent.Close()

	var pkg packageDoc
	if err := xml.NewDecoder(rootContent).Decode(&pkg); err != nil {
		log.Printf("Error parsing root file: %v\n", err)
		http.Error(w, "Error parsing EPUB content", http.StatusInternalServerError)
		return
	}

	// Create map of manifest items for quick lookup
	manifestMap := make(map[string]item)
	for _, item := range pkg.Manifest.Items {
		manifestMap[item.ID] = item
	}

	// Process each chapter in spine
	var chapters []string
	for _, itemRef := range pkg.Spine.ItemRefs {
		item, exists := manifestMap[itemRef.IDRef]
		if !exists {
			log.Printf("Item %s not found in manifest\n", itemRef.IDRef)
			continue
		}

		// Find chapter file in zip
		chapterPath := filepath.Join(filepath.Dir(rootFilePath), item.Href)
		var chapterFile *zip.File
		for _, f := range reader.File {
			if f.Name == chapterPath {
				chapterFile = f
				break
			}
		}

		if chapterFile == nil {
			log.Printf("Chapter file %s not found\n", chapterPath)
			continue
		}

		// Open and convert chapter
		chapterContent, err := chapterFile.Open()
		if err != nil {
			log.Printf("Error reading chapter file: %v\n", err)
			continue
		}
		defer chapterContent.Close()

		var out bytes.Buffer
		cmd := exec.Command("pandoc", "-f", "html", "-t", "markdown")
		cmd.Stdin = chapterContent
		cmd.Stdout = &out
		cmd.Stderr = os.Stderr

		if err := cmd.Run(); err != nil {
			log.Printf("Pandoc conversion error: %v\n", err)
			continue
		}

		chapters = append(chapters, out.String())
	}

	// Return chapters as JSON response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"chapters": chapters,
	})
}
