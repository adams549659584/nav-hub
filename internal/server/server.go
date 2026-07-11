package server

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/adams549659584/nav-hub/internal/auth"
	"github.com/adams549659584/nav-hub/internal/favicon"
	"github.com/adams549659584/nav-hub/internal/seed"
	"github.com/adams549659584/nav-hub/internal/static"
	"github.com/adams549659584/nav-hub/internal/store"
	"github.com/adams549659584/nav-hub/internal/wallpaper"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"golang.org/x/crypto/bcrypt"
)

// Options 启动配置；零值字段会从环境变量或默认值填充。
type Options struct {
	DatabaseDSN   string
	AdminUser     string
	AdminPassword string
	SessionSecret string
}

// New 初始化数据库与路由，返回 http.Handler。
func New(opts Options) (http.Handler, error) {
	opts = opts.withDefaults()

	db, err := store.Open(opts.DatabaseDSN)
	if err != nil {
		return nil, err
	}

	ctx := context.Background()
	if empty, _ := db.IsEmpty(ctx); empty {
		if err := db.SeedFromJSON(ctx, seed.JSON); err != nil {
			_ = db.Close()
			return nil, fmt.Errorf("seed: %w", err)
		}
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(opts.AdminPassword), bcrypt.DefaultCost)
	if err != nil {
		_ = db.Close()
		return nil, err
	}
	if err := db.EnsureAdmin(ctx, opts.AdminUser, string(hash)); err != nil {
		_ = db.Close()
		return nil, err
	}

	sessions := auth.NewManager(opts.SessionSecret)

	r := chi.NewRouter()
	r.Use(middleware.RequestID, middleware.RealIP, middleware.Logger, middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Route("/api", func(api chi.Router) {
		api.Get("/public/config", func(w http.ResponseWriter, req *http.Request) {
			cfg, err := db.LoadConfig(req.Context())
			if err != nil {
				jsonError(w, http.StatusInternalServerError, err.Error())
				return
			}
			jsonOK(w, cfg)
		})

		wallpaper.Register(api)
		favicon.Register(api)

		api.Get("/auth/me", func(w http.ResponseWriter, req *http.Request) {
			jsonOK(w, map[string]bool{"admin": sessions.IsLoggedIn(req)})
		})

		api.Post("/auth/login", func(w http.ResponseWriter, req *http.Request) {
			var body struct {
				Username string `json:"username"`
				Password string `json:"password"`
			}
			if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
				jsonError(w, http.StatusBadRequest, "invalid json")
				return
			}
			stored, err := db.AdminPasswordHash(req.Context(), body.Username)
			if err != nil || bcrypt.CompareHashAndPassword([]byte(stored), []byte(body.Password)) != nil {
				jsonError(w, http.StatusUnauthorized, "invalid credentials")
				return
			}
			sessions.SetLoggedIn(w, body.Username)
			jsonOK(w, map[string]bool{"ok": true})
		})

		api.Post("/auth/logout", func(w http.ResponseWriter, req *http.Request) {
			sessions.Clear(w)
			jsonOK(w, map[string]bool{"ok": true})
		})

		api.With(sessions.RequireAdmin).Post("/admin/password", func(w http.ResponseWriter, req *http.Request) {
			username, ok := sessions.Username(req)
			if !ok || username == "" {
				jsonError(w, http.StatusUnauthorized, "unauthorized")
				return
			}
			var body struct {
				CurrentPassword string `json:"currentPassword"`
				NewPassword     string `json:"newPassword"`
			}
			if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
				jsonError(w, http.StatusBadRequest, "invalid json")
				return
			}
			if len(body.NewPassword) < 6 {
				jsonError(w, http.StatusBadRequest, "new password must be at least 6 characters")
				return
			}
			stored, err := db.AdminPasswordHash(req.Context(), username)
			if err != nil || bcrypt.CompareHashAndPassword([]byte(stored), []byte(body.CurrentPassword)) != nil {
				jsonError(w, http.StatusUnauthorized, "current password is incorrect")
				return
			}
			hash, err := bcrypt.GenerateFromPassword([]byte(body.NewPassword), bcrypt.DefaultCost)
			if err != nil {
				jsonError(w, http.StatusInternalServerError, "hash failed")
				return
			}
			if err := db.UpdateAdminPassword(req.Context(), username, string(hash)); err != nil {
				jsonError(w, http.StatusInternalServerError, err.Error())
				return
			}
			jsonOK(w, map[string]bool{"ok": true})
		})

		api.With(sessions.RequireAdmin).Put("/admin/config", func(w http.ResponseWriter, req *http.Request) {
			body, err := io.ReadAll(io.LimitReader(req.Body, 10<<20))
			if err != nil {
				jsonError(w, http.StatusBadRequest, "read body")
				return
			}
			var cfg store.SiteConfig
			if err := json.Unmarshal(body, &cfg); err != nil {
				jsonError(w, http.StatusBadRequest, "invalid config json")
				return
			}
			if cfg.Settings == nil {
				cfg.Settings = map[string]any{}
			}
			if err := db.SaveConfig(req.Context(), &cfg); err != nil {
				jsonError(w, http.StatusInternalServerError, err.Error())
				return
			}
			jsonOK(w, map[string]bool{"ok": true})
		})
	})

	r.Handle("/*", static.Handler())
	return r, nil
}

// Addr 返回监听地址（仅本地进程使用）。
func Addr() string {
	return env("ADDR", ":8080")
}

// ReadHeaderTimeout 用于本地 http.Server。
func ReadHeaderTimeout() time.Duration {
	return 10 * time.Second
}

func (o Options) withDefaults() Options {
	if o.DatabaseDSN == "" {
		o.DatabaseDSN = defaultDSN()
	}
	if o.AdminUser == "" {
		o.AdminUser = env("ADMIN_USER", "admin")
	}
	if o.AdminPassword == "" {
		o.AdminPassword = env("ADMIN_PASSWORD", "admin")
	}
	if o.SessionSecret == "" {
		o.SessionSecret = env("SESSION_SECRET", "dev-secret-change-me")
	}
	return o
}

func defaultDSN() string {
	if v := os.Getenv("DATABASE_DSN"); v != "" {
		return v
	}
	if os.Getenv("VERCEL") != "" || os.Getenv("AWS_LAMBDA_FUNCTION_NAME") != "" {
		return "file:/tmp/nav-hub.db?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)"
	}
	return "file:./data/app.db?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)"
}

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func jsonOK(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(v)
}

func jsonError(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
