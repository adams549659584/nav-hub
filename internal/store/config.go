package store

// SiteConfig matches the frontend export/import JSON shape.
type SiteConfig struct {
	Categories []map[string]any `json:"categories"`
	Shortcuts  []map[string]any `json:"shortcuts"`
	Settings   map[string]any   `json:"settings"`
}