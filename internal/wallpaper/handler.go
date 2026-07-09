package wallpaper

import (
	"encoding/json"
	"net/http"
	"strconv"
)

// Register mounts public wallpaper routes under the given router mux.
// Expects paths relative to /api, e.g. r is chi.Router already at /api.
func Register(mux interface {
	Get(pattern string, handlerFn http.HandlerFunc)
}) {
	mux.Get("/public/wallpapers/sources", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{"sources": Sources()})
	})

	mux.Get("/public/wallpapers", func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		source := q.Get("source")
		page, _ := strconv.Atoi(q.Get("page"))
		size, _ := strconv.Atoi(q.Get("size"))
		query := q.Get("q")
		res, err := List(source, page, size, query)
		if err != nil {
			writeJSON(w, http.StatusBadGateway, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, res)
	})
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}
