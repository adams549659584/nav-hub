package main

import (
	"log"
	"net/http"

	"github.com/adams549659584/nav-hub/internal/server"
)

func main() {
	h, err := server.New(server.Options{})
	if err != nil {
		log.Fatal(err)
	}

	addr := server.Addr()
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
