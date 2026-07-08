package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	_ "modernc.org/sqlite"
)

type DB struct {
	sql *sql.DB
}

func Open(dsn string) (*DB, error) {
	if dsn == "" {
		dsn = "file:./data/app.db?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)"
	}
	if err := os.MkdirAll(filepath.Dir(extractPath(dsn)), 0o755); err != nil && !os.IsExist(err) {
		// file:./data/app.db — ensure ./data exists
		_ = os.MkdirAll("data", 0o755)
	}
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &DB{sql: db}
	if err := s.migrate(); err != nil {
		db.Close()
		return nil, err
	}
	return s, nil
}

func extractPath(dsn string) string {
	if len(dsn) > 5 && dsn[:5] == "file:" {
		p := dsn[5:]
		if i := strings.IndexByte(p, '?'); i >= 0 {
			p = p[:i]
		}
		return p
	}
	return "data/app.db"
}

func (d *DB) Close() error {
	return d.sql.Close()
}

func (d *DB) migrate() error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS categories (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			icon TEXT NOT NULL DEFAULT 'Grid',
			sort_order INTEGER NOT NULL DEFAULT 0
		)`,
		`CREATE TABLE IF NOT EXISTS shortcuts (
			id TEXT PRIMARY KEY,
			category_id TEXT NOT NULL,
			payload TEXT NOT NULL,
			FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS settings (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			payload TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS admin_users (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			username TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL
		)`,
	}
	for _, s := range stmts {
		if _, err := d.sql.Exec(s); err != nil {
			return err
		}
	}
	return nil
}

func (d *DB) IsEmpty(ctx context.Context) (bool, error) {
	var n int
	err := d.sql.QueryRowContext(ctx, `SELECT COUNT(*) FROM categories`).Scan(&n)
	return n == 0, err
}

func (d *DB) LoadConfig(ctx context.Context) (*SiteConfig, error) {
	cats, err := d.loadCategories(ctx)
	if err != nil {
		return nil, err
	}
	shortcuts, err := d.loadShortcuts(ctx)
	if err != nil {
		return nil, err
	}
	settings, err := d.loadSettings(ctx)
	if err != nil {
		return nil, err
	}
	return &SiteConfig{
		Categories: cats,
		Shortcuts:  shortcuts,
		Settings:   settings,
	}, nil
}

func (d *DB) loadCategories(ctx context.Context) ([]map[string]any, error) {
	rows, err := d.sql.QueryContext(ctx, `SELECT id, name, icon FROM categories ORDER BY sort_order, id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id, name, icon string
		if err := rows.Scan(&id, &name, &icon); err != nil {
			return nil, err
		}
		out = append(out, map[string]any{"id": id, "name": name, "icon": icon})
	}
	return out, rows.Err()
}

func (d *DB) loadShortcuts(ctx context.Context) ([]map[string]any, error) {
	rows, err := d.sql.QueryContext(ctx, `SELECT payload FROM shortcuts`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var raw string
		if err := rows.Scan(&raw); err != nil {
			return nil, err
		}
		var m map[string]any
		if err := json.Unmarshal([]byte(raw), &m); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (d *DB) loadSettings(ctx context.Context) (map[string]any, error) {
	var raw string
	err := d.sql.QueryRowContext(ctx, `SELECT payload FROM settings WHERE id = 1`).Scan(&raw)
	if errors.Is(err, sql.ErrNoRows) {
		return map[string]any{}, nil
	}
	if err != nil {
		return nil, err
	}
	var m map[string]any
	if err := json.Unmarshal([]byte(raw), &m); err != nil {
		return nil, err
	}
	return m, nil
}

func (d *DB) SaveConfig(ctx context.Context, cfg *SiteConfig) error {
	if cfg == nil {
		return errors.New("nil config")
	}
	tx, err := d.sql.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `DELETE FROM shortcuts`); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM categories`); err != nil {
		return err
	}

	for i, c := range cfg.Categories {
		id, _ := c["id"].(string)
		name, _ := c["name"].(string)
		icon, _ := c["icon"].(string)
		if icon == "" {
			icon = "Grid"
		}
		if id == "" || name == "" {
			return fmt.Errorf("invalid category at index %d", i)
		}
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO categories (id, name, icon, sort_order) VALUES (?, ?, ?, ?)`,
			id, name, icon, i); err != nil {
			return err
		}
	}

	for _, s := range cfg.Shortcuts {
		id, _ := s["id"].(string)
		catID, _ := s["categoryId"].(string)
		if id == "" || catID == "" {
			return errors.New("shortcut missing id or categoryId")
		}
		raw, err := json.Marshal(s)
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO shortcuts (id, category_id, payload) VALUES (?, ?, ?)`,
			id, catID, string(raw)); err != nil {
			return err
		}
	}

	settingsRaw, err := json.Marshal(cfg.Settings)
	if err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO settings (id, payload) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload`,
		string(settingsRaw)); err != nil {
		return err
	}

	return tx.Commit()
}

func (d *DB) SeedFromJSON(ctx context.Context, raw []byte) error {
	var cfg SiteConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return err
	}
	return d.SaveConfig(ctx, &cfg)
}

func (d *DB) HasAdmin(ctx context.Context) (bool, error) {
	var n int
	err := d.sql.QueryRowContext(ctx, `SELECT COUNT(*) FROM admin_users`).Scan(&n)
	return n > 0, err
}

func (d *DB) EnsureAdmin(ctx context.Context, username, passwordHash string) error {
	has, err := d.HasAdmin(ctx)
	if err != nil {
		return err
	}
	if has {
		return nil
	}
	_, err = d.sql.ExecContext(ctx,
		`INSERT INTO admin_users (id, username, password_hash) VALUES (1, ?, ?)`,
		username, passwordHash)
	return err
}

func (d *DB) AdminPasswordHash(ctx context.Context, username string) (string, error) {
	var hash string
	err := d.sql.QueryRowContext(ctx,
		`SELECT password_hash FROM admin_users WHERE username = ?`, username).Scan(&hash)
	return hash, err
}