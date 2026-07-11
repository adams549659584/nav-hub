package server

import (
	"log"
	"net/http"
	"os"
	"strings"
)

// ListenAndServe 启动 HTTP 服务。
// Vercel Go Framework Preset 注入 PORT；本地默认用 ADDR（:8080）。
func ListenAndServe(h http.Handler) error {
	addr := Addr()
	if port := os.Getenv("PORT"); port != "" {
		if !strings.HasPrefix(port, ":") {
			port = ":" + port
		}
		addr = port
	}

	srv := &http.Server{
		Addr:              addr,
		Handler:           h,
		ReadHeaderTimeout: ReadHeaderTimeout(),
	}
	log.Printf("nav-hub listening on %s", addr)
	err := srv.ListenAndServe()
	if err != nil && err != http.ErrServerClosed {
		return err
	}
	return nil
}
