package store

// SiteConfig matches the frontend export/import JSON shape.
type SiteConfig struct {
	Categories []Category     `json:"categories"`
	Shortcuts  []Shortcut     `json:"shortcuts"`
	Settings   map[string]any `json:"settings"`
}

// Category is a sidebar navigation group.
// Code holds a stable slug (e.g. "common"); id is a numeric primary key.
type Category struct {
	ID   int64  `json:"id"`
	Code string `json:"code"`
	Name string `json:"name"`
	Icon string `json:"icon"`
}

// Shortcut is a grid tile linking to a URL.
// CategoryIDs: many-to-many membership (a shortcut can appear in multiple categories).
type Shortcut struct {
	ID          int64   `json:"id"`
	CategoryIDs []int64 `json:"categoryIds"`
	Name        string  `json:"name"`
	URL         string  `json:"url"`
	Letter      string  `json:"letter,omitempty"`
	BgColor     string  `json:"bgColor,omitempty"`
	Favicon     string  `json:"favicon,omitempty"`
}
