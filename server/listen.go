package server

import (
	"log"
	"net/http"
	"os"
	"strings"
)

// ListenAndServe 启动 HTTP 服务。
// 优先级：PORT → ADDR（默认 :8080）。Docker / Dockerfile.vercel 均设 PORT=8080。
func ListenAndServe(h http.Handler) error {
	addr := resolveListenAddr()

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

func resolveListenAddr() string {
	if port := os.Getenv("PORT"); port != "" {
		if !strings.HasPrefix(port, ":") {
			port = ":" + port
		}
		return port
	}
	return Addr()
}
