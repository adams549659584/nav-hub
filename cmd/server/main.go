// Vercel Go Framework Preset 要求入口为 main.go / cmd/api/main.go / cmd/server/main.go。
package main

import (
	"log"

	"github.com/adams549659584/nav-hub/server"
)

func main() {
	h, err := server.New(server.Options{})
	if err != nil {
		log.Fatal(err)
	}
	if err := server.ListenAndServe(h); err != nil {
		log.Fatal(err)
	}
}
