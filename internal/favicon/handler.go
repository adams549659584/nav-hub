package favicon

import (
	"encoding/json"
	"net/http"
)

// Register mounts public favicon routes under the given router mux.
func Register(mux interface {
	Get(pattern string, handlerFn http.HandlerFunc)
}) {
	mux.Get("/public/favicon", func(w http.ResponseWriter, r *http.Request) {
		raw := r.URL.Query().Get("url")
		if raw == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing url"})
			return
		}
		dataURL, err := Fetch(r.Context(), raw)
		if err != nil {
			writeJSON(w, http.StatusBadGateway, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"favicon": dataURL})
	})
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}
