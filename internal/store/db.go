package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	_ "modernc.org/sqlite"
)

const schemaVersion = 2

type DB struct {
	sql *sql.DB
}

func Open(dsn string) (*DB, error) {
	if dsn == "" {
		dsn = "file:./data/app.db?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)"
	}
	if err := os.MkdirAll(filepath.Dir(extractPath(dsn)), 0o755); err != nil && !os.IsExist(err) {
		_ = os.MkdirAll("data", 0o755)
	}
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	// Enforce FK for this connection (modernc respects pragma via DSN; also set explicitly).
	if _, err := db.Exec(`PRAGMA foreign_keys = ON`); err != nil {
		db.Close()
		return nil, err
	}
	if err := db.Ping(); err != nil {
		db.Close()
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
	if _, err := d.sql.Exec(`CREATE TABLE IF NOT EXISTS schema_meta (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL
	)`); err != nil {
		return err
	}

	ver, err := d.getSchemaVersion()
	if err != nil {
		return err
	}

	// Fresh DB or unknown: ensure v2 tables exist.
	if ver == 0 {
		// Detect legacy v1 (categories.id TEXT, no code column).
		if has, _ := d.tableExists("categories"); has {
			if cols, _ := d.tableColumns("categories"); !contains(cols, "code") {
				if err := d.migrateV1ToV2(); err != nil {
					return fmt.Errorf("migrate v1→v2: %w", err)
				}
				return d.setSchemaVersion(schemaVersion)
			}
		}
		if err := d.createV2Schema(); err != nil {
			return err
		}
		return d.setSchemaVersion(schemaVersion)
	}

	if ver < schemaVersion {
		// Future stepwise migrations go here.
		if ver == 1 {
			if err := d.migrateV1ToV2(); err != nil {
				return err
			}
		}
		return d.setSchemaVersion(schemaVersion)
	}

	// Already at current version: ensure tables (CREATE IF NOT EXISTS).
	return d.createV2Schema()
}

func (d *DB) getSchemaVersion() (int, error) {
	var v string
	err := d.sql.QueryRow(`SELECT value FROM schema_meta WHERE key = 'version'`).Scan(&v)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, nil
	}
	if err != nil {
		// schema_meta may not exist yet on very old DBs
		if strings.Contains(err.Error(), "no such table") {
			return 0, nil
		}
		return 0, err
	}
	n, _ := strconv.Atoi(v)
	return n, nil
}

func (d *DB) setSchemaVersion(v int) error {
	_, err := d.sql.Exec(
		`INSERT INTO schema_meta (key, value) VALUES ('version', ?)
		 ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
		strconv.Itoa(v),
	)
	return err
}

func (d *DB) createV2Schema() error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS categories (
			id INTEGER PRIMARY KEY,
			code TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL,
			icon TEXT NOT NULL DEFAULT 'Grid',
			sort_order INTEGER NOT NULL DEFAULT 0
		)`,
		`CREATE TABLE IF NOT EXISTS shortcuts (
			id INTEGER PRIMARY KEY,
			category_id INTEGER NOT NULL,
			name TEXT NOT NULL,
			url TEXT NOT NULL,
			letter TEXT NOT NULL DEFAULT '',
			bg_color TEXT NOT NULL DEFAULT '#3b82f6',
			favicon TEXT NOT NULL DEFAULT '',
			sort_order INTEGER NOT NULL DEFAULT 0,
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
		`CREATE INDEX IF NOT EXISTS idx_shortcuts_category ON shortcuts(category_id)`,
	}
	for _, s := range stmts {
		if _, err := d.sql.Exec(s); err != nil {
			return err
		}
	}
	return nil
}

// migrateV1ToV2 converts TEXT id + JSON payload schema to integer ids + columns.
func (d *DB) migrateV1ToV2() error {
	tx, err := d.sql.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`PRAGMA foreign_keys = OFF`); err != nil {
		return err
	}

	// Read legacy categories
	type legacyCat struct {
		ID   string
		Name string
		Icon string
		Sort int
	}
	var cats []legacyCat
	rows, err := tx.Query(`SELECT id, name, icon, sort_order FROM categories ORDER BY sort_order, id`)
	if err == nil {
		for rows.Next() {
			var c legacyCat
			if err := rows.Scan(&c.ID, &c.Name, &c.Icon, &c.Sort); err != nil {
				rows.Close()
				return err
			}
			cats = append(cats, c)
		}
		err = rows.Err()
		rows.Close()
		if err != nil {
			return err
		}
	}

	// Read legacy shortcuts (payload JSON)
	type legacySC struct {
		ID         string
		CategoryID string
		Payload    string
	}
	var scs []legacySC
	rows, err = tx.Query(`SELECT id, category_id, payload FROM shortcuts`)
	if err == nil {
		for rows.Next() {
			var s legacySC
			if err := rows.Scan(&s.ID, &s.CategoryID, &s.Payload); err != nil {
				rows.Close()
				return err
			}
			scs = append(scs, s)
		}
		err = rows.Err()
		rows.Close()
		if err != nil {
			return err
		}
	}

	// Drop old tables and recreate v2
	for _, t := range []string{"shortcuts", "categories"} {
		if _, err := tx.Exec(`DROP TABLE IF EXISTS ` + t); err != nil {
			return err
		}
	}

	for _, s := range []string{
		`CREATE TABLE categories (
			id INTEGER PRIMARY KEY,
			code TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL,
			icon TEXT NOT NULL DEFAULT 'Grid',
			sort_order INTEGER NOT NULL DEFAULT 0
		)`,
		`CREATE TABLE shortcuts (
			id INTEGER PRIMARY KEY,
			category_id INTEGER NOT NULL,
			name TEXT NOT NULL,
			url TEXT NOT NULL,
			letter TEXT NOT NULL DEFAULT '',
			bg_color TEXT NOT NULL DEFAULT '#3b82f6',
			favicon TEXT NOT NULL DEFAULT '',
			sort_order INTEGER NOT NULL DEFAULT 0,
			FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
		)`,
		`CREATE INDEX IF NOT EXISTS idx_shortcuts_category ON shortcuts(category_id)`,
	} {
		if _, err := tx.Exec(s); err != nil {
			return err
		}
	}

	codeToID := make(map[string]int64, len(cats))
	for i, c := range cats {
		id := int64(i + 1)
		code := c.ID
		if code == "" {
			code = fmt.Sprintf("cat-%d", id)
		}
		icon := c.Icon
		if icon == "" {
			icon = "Grid"
		}
		if _, err := tx.Exec(
			`INSERT INTO categories (id, code, name, icon, sort_order) VALUES (?, ?, ?, ?, ?)`,
			id, code, c.Name, icon, i,
		); err != nil {
			return err
		}
		codeToID[c.ID] = id
	}

	for i, s := range scs {
		var m map[string]any
		_ = json.Unmarshal([]byte(s.Payload), &m)
		if m == nil {
			m = map[string]any{}
		}
		catCode := s.CategoryID
		if catCode == "" {
			if v, ok := m["categoryId"].(string); ok {
				catCode = v
			}
		}
		catID, ok := codeToID[catCode]
		if !ok {
			continue // orphan
		}
		name, _ := m["name"].(string)
		url, _ := m["url"].(string)
		if name == "" || url == "" {
			continue
		}
		letter, _ := m["letter"].(string)
		bg, _ := m["bgColor"].(string)
		if bg == "" {
			bg = "#3b82f6"
		}
		favicon, _ := m["favicon"].(string)
		if _, err := tx.Exec(
			`INSERT INTO shortcuts (id, category_id, name, url, letter, bg_color, favicon, sort_order)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			int64(i+1), catID, name, url, letter, bg, favicon, i,
		); err != nil {
			return err
		}
	}

	if _, err := tx.Exec(`PRAGMA foreign_keys = ON`); err != nil {
		return err
	}
	return tx.Commit()
}

func (d *DB) tableExists(name string) (bool, error) {
	var n int
	err := d.sql.QueryRow(
		`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?`, name,
	).Scan(&n)
	return n > 0, err
}

func (d *DB) tableColumns(table string) ([]string, error) {
	rows, err := d.sql.Query(`PRAGMA table_info(` + table + `)`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var cols []string
	for rows.Next() {
		var cid int
		var name, ctype string
		var notnull, pk int
		var dflt sql.NullString
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dflt, &pk); err != nil {
			return nil, err
		}
		cols = append(cols, name)
	}
	return cols, rows.Err()
}

func contains(ss []string, want string) bool {
	for _, s := range ss {
		if s == want {
			return true
		}
	}
	return false
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

func (d *DB) loadCategories(ctx context.Context) ([]Category, error) {
	rows, err := d.sql.QueryContext(ctx,
		`SELECT id, code, name, icon FROM categories ORDER BY sort_order, id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Category
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Code, &c.Name, &c.Icon); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	if out == nil {
		out = []Category{}
	}
	return out, rows.Err()
}

func (d *DB) loadShortcuts(ctx context.Context) ([]Shortcut, error) {
	rows, err := d.sql.QueryContext(ctx,
		`SELECT id, category_id, name, url, letter, bg_color, favicon
		 FROM shortcuts ORDER BY sort_order, id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Shortcut
	for rows.Next() {
		var s Shortcut
		if err := rows.Scan(&s.ID, &s.CategoryID, &s.Name, &s.URL, &s.Letter, &s.BgColor, &s.Favicon); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	if out == nil {
		out = []Shortcut{}
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
	if cfg.Settings == nil {
		cfg.Settings = map[string]any{}
	}

	// Normalize: assign missing ids, ensure codes, validate.
	if err := normalizeConfig(cfg); err != nil {
		return err
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
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO categories (id, code, name, icon, sort_order) VALUES (?, ?, ?, ?, ?)`,
			c.ID, c.Code, c.Name, c.Icon, i); err != nil {
			return err
		}
	}

	for i, s := range cfg.Shortcuts {
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO shortcuts (id, category_id, name, url, letter, bg_color, favicon, sort_order)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			s.ID, s.CategoryID, s.Name, s.URL, s.Letter, s.BgColor, s.Favicon, i); err != nil {
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

// normalizeConfig fills ids/codes and validates foreign keys.
func normalizeConfig(cfg *SiteConfig) error {
	usedCatID := map[int64]bool{}
	usedCode := map[string]bool{}
	var nextCatID int64 = 1
	for _, c := range cfg.Categories {
		if c.ID >= nextCatID {
			nextCatID = c.ID + 1
		}
	}
	for i := range cfg.Categories {
		c := &cfg.Categories[i]
		if c.Name == "" {
			return fmt.Errorf("invalid category at index %d: empty name", i)
		}
		if c.Icon == "" {
			c.Icon = "Grid"
		}
		if c.ID <= 0 {
			for usedCatID[nextCatID] {
				nextCatID++
			}
			c.ID = nextCatID
			nextCatID++
		}
		if usedCatID[c.ID] {
			return fmt.Errorf("duplicate category id %d", c.ID)
		}
		usedCatID[c.ID] = true

		if c.Code == "" {
			c.Code = fmt.Sprintf("cat-%d", c.ID)
		}
		if usedCode[c.Code] {
			return fmt.Errorf("duplicate category code %q", c.Code)
		}
		usedCode[c.Code] = true
	}

	usedSC := map[int64]bool{}
	var nextSC int64 = 1
	for _, s := range cfg.Shortcuts {
		if s.ID >= nextSC {
			nextSC = s.ID + 1
		}
	}
	for i := range cfg.Shortcuts {
		s := &cfg.Shortcuts[i]
		if s.Name == "" || s.URL == "" {
			return fmt.Errorf("shortcut at index %d missing name or url", i)
		}
		if !usedCatID[s.CategoryID] {
			return fmt.Errorf("shortcut %q references unknown categoryId %d", s.Name, s.CategoryID)
		}
		if s.ID <= 0 {
			for usedSC[nextSC] {
				nextSC++
			}
			s.ID = nextSC
			nextSC++
		}
		if usedSC[s.ID] {
			return fmt.Errorf("duplicate shortcut id %d", s.ID)
		}
		usedSC[s.ID] = true
		// bgColor 允许为空（透明背景，常用于自定义图标）
	}
	return nil
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
