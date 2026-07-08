package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/adams549659584/nav-hub/internal/auth"
	"github.com/adams549659584/nav-hub/internal/seed"
	"github.com/adams549659584/nav-hub/internal/static"
	"github.com/adams549659584/nav-hub/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	dsn := env("DATABASE_DSN", "file:./data/app.db?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)")
	addr := env("ADDR", ":8080")
	adminUser := env("ADMIN_USER", "admin")
	adminPass := env("ADMIN_PASSWORD", "admin")
	sessionSecret := env("SESSION_SECRET", "dev-secret-change-me")

	db, err := store.Open(dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	ctx := context.Background()
	if empty, _ := db.IsEmpty(ctx); empty {
		if err := db.SeedFromJSON(ctx, seed.JSON); err != nil {
			log.Fatal("seed:", err)
		}
		log.Println("seeded database from seed.json")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(adminPass), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}
	if err := db.EnsureAdmin(ctx, adminUser, string(hash)); err != nil {
		log.Fatal(err)
	}

	sessions := auth.NewManager(sessionSecret)

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
		api.Get("/public/config", func(w http.ResponseWriter, r *http.Request) {
			cfg, err := db.LoadConfig(r.Context())
			if err != nil {
				jsonError(w, http.StatusInternalServerError, err.Error())
				return
			}
			jsonOK(w, cfg)
		})

		api.Get("/auth/me", func(w http.ResponseWriter, r *http.Request) {
			jsonOK(w, map[string]bool{"admin": sessions.IsLoggedIn(r)})
		})

		api.Post("/auth/login", func(w http.ResponseWriter, r *http.Request) {
			var body struct {
				Username string `json:"username"`
				Password string `json:"password"`
			}
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				jsonError(w, http.StatusBadRequest, "invalid json")
				return
			}
			stored, err := db.AdminPasswordHash(r.Context(), body.Username)
			if err != nil || bcrypt.CompareHashAndPassword([]byte(stored), []byte(body.Password)) != nil {
				jsonError(w, http.StatusUnauthorized, "invalid credentials")
				return
			}
			sessions.SetLoggedIn(w, body.Username)
			jsonOK(w, map[string]bool{"ok": true})
		})

		api.Post("/auth/logout", func(w http.ResponseWriter, r *http.Request) {
			sessions.Clear(w)
			jsonOK(w, map[string]bool{"ok": true})
		})

		api.With(sessions.RequireAdmin).Put("/admin/config", func(w http.ResponseWriter, r *http.Request) {
			body, err := io.ReadAll(io.LimitReader(r.Body, 10<<20))
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
			if err := db.SaveConfig(r.Context(), &cfg); err != nil {
				jsonError(w, http.StatusInternalServerError, err.Error())
				return
			}
			jsonOK(w, map[string]bool{"ok": true})
		})
	})

	r.Handle("/*", static.Handler())

	srv := &http.Server{Addr: addr, Handler: r, ReadHeaderTimeout: 10 * time.Second}
	log.Printf("nav-hub listening on %s", addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
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