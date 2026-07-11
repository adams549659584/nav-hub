package handler

import (
	"net/http"
	"sync"

	"github.com/adams549659584/nav-hub/internal/server"
)

var (
	once    sync.Once
	handler http.Handler
	initErr error
)

func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(func() {
		handler, initErr = server.New(server.Options{})
	})
	if initErr != nil {
		http.Error(w, initErr.Error(), http.StatusInternalServerError)
		return
	}
	handler.ServeHTTP(w, r)
}
