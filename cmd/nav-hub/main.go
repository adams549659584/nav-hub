package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/adams549659584/nav-hub/server"
)

func main() {
	h, err := server.New(server.Options{})
	if err != nil {
		log.Fatal(err)
	}

	// Vercel Go Framework Preset 注入 PORT；本地仍用 ADDR（默认 :8080）
	addr := server.Addr()
	if port := os.Getenv("PORT"); port != "" {
		if !strings.HasPrefix(port, ":") {
			port = ":" + port
		}
		addr = port
	}

	srv := &http.Server{
		Addr:              addr,
		Handler:           h,
		ReadHeaderTimeout: server.ReadHeaderTimeout(),
	}
	log.Printf("nav-hub listening on %s", addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
