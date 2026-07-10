package favicon

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"sort"
	"strings"
	"time"
)

const (
	maxBytes     = 200 * 1024
	totalTimeout = 8 * time.Second
	reqTimeout   = 5 * time.Second
)

var (
	linkTagRe = regexp.MustCompile(`(?is)<link\b[^>]*>`)
	attrRe    = regexp.MustCompile(`(?i)([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))`)
	svgTagRe  = regexp.MustCompile(`(?is)<svg\b`)
)

type candidate struct {
	href  string
	score int
}

// Fetch resolves a page URL and returns a data-URL favicon (SVG preferred).
func Fetch(ctx context.Context, rawURL string) (string, error) {
	pageURL, err := normalizeURL(rawURL)
	if err != nil {
		return "", err
	}

	deadline := time.Now().Add(totalTimeout)
	ctx, cancel := context.WithDeadline(ctx, deadline)
	defer cancel()

	client := &http.Client{
		Timeout: reqTimeout,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 5 {
				return fmt.Errorf("too many redirects")
			}
			return nil
		},
	}

	var candidates []candidate
	if html, base, err := fetchHTML(ctx, client, pageURL); err == nil {
		candidates = parseIconLinks(html, base)
	}

	// Path fallbacks (SVG first)
	origin := pageURL.Scheme + "://" + pageURL.Host
	candidates = append(candidates,
		candidate{href: origin + "/favicon.svg", score: 80},
		candidate{href: origin + "/favicon.ico", score: 20},
	)

	sort.SliceStable(candidates, func(i, j int) bool {
		return candidates[i].score > candidates[j].score
	})

	seen := make(map[string]struct{})
	for _, c := range candidates {
		if c.href == "" {
			continue
		}
		if _, ok := seen[c.href]; ok {
			continue
		}
		seen[c.href] = struct{}{}
		if time.Now().After(deadline) {
			break
		}
		dataURL, err := downloadAsDataURL(ctx, client, c.href)
		if err == nil && dataURL != "" {
			return dataURL, nil
		}
	}
	return "", fmt.Errorf("no favicon found")
}

func normalizeURL(raw string) (*url.URL, error) {
	s := strings.TrimSpace(raw)
	if s == "" {
		return nil, fmt.Errorf("empty url")
	}
	if !strings.HasPrefix(s, "http://") && !strings.HasPrefix(s, "https://") {
		s = "https://" + s
	}
	u, err := url.Parse(s)
	if err != nil || u.Host == "" {
		return nil, fmt.Errorf("invalid url")
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return nil, fmt.Errorf("unsupported scheme")
	}
	// Only fetch the origin home for link tags
	u.Path = "/"
	u.RawQuery = ""
	u.Fragment = ""
	return u, nil
}

func fetchHTML(ctx context.Context, client *http.Client, pageURL *url.URL) (string, *url.URL, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, pageURL.String(), nil)
	if err != nil {
		return "", nil, err
	}
	req.Header.Set("User-Agent", "nav-hub-favicon/1.0")
	req.Header.Set("Accept", "text/html,application/xhtml+xml")

	res, err := client.Do(req)
	if err != nil {
		return "", nil, err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return "", nil, fmt.Errorf("http %d", res.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(res.Body, 512*1024))
	if err != nil {
		return "", nil, err
	}
	base := pageURL
	if res.Request != nil && res.Request.URL != nil {
		base = res.Request.URL
	}
	return string(body), base, nil
}

func parseIconLinks(html string, base *url.URL) []candidate {
	var out []candidate
	for _, tag := range linkTagRe.FindAllString(html, -1) {
		attrs := parseAttrs(tag)
		rel := strings.ToLower(attrs["rel"])
		if rel == "" {
			continue
		}
		if !strings.Contains(rel, "icon") {
			continue
		}
		href := attrs["href"]
		if href == "" || strings.HasPrefix(strings.ToLower(href), "data:") {
			continue
		}
		abs, err := base.Parse(href)
		if err != nil || abs.Scheme == "" || abs.Host == "" {
			continue
		}
		if abs.Scheme != "http" && abs.Scheme != "https" {
			continue
		}
		out = append(out, candidate{
			href:  abs.String(),
			score: scoreIcon(rel, attrs["type"], href, attrs["sizes"]),
		})
	}
	return out
}

func parseAttrs(tag string) map[string]string {
	m := make(map[string]string)
	for _, match := range attrRe.FindAllStringSubmatch(tag, -1) {
		key := strings.ToLower(match[1])
		val := match[2]
		if val == "" {
			val = match[3]
		}
		if val == "" {
			val = match[4]
		}
		m[key] = val
	}
	return m
}

func scoreIcon(rel, typ, href, sizes string) int {
	rel = strings.ToLower(rel)
	typ = strings.ToLower(typ)
	hrefL := strings.ToLower(href)
	score := 40

	// SVG first-class
	if strings.Contains(typ, "svg") || strings.HasSuffix(strings.Split(hrefL, "?")[0], ".svg") {
		score += 100
	}
	if strings.Contains(rel, "apple-touch-icon") {
		score += 25
	} else if strings.Contains(rel, "shortcut") {
		score += 10
	} else if rel == "icon" || strings.HasPrefix(rel, "icon ") {
		score += 20
	}
	if strings.Contains(typ, "png") {
		score += 15
	}
	if strings.HasSuffix(strings.Split(hrefL, "?")[0], ".ico") {
		score += 5
	}
	// Prefer larger sizes when present (e.g. 180x180)
	if sizes != "" && sizes != "any" {
		var maxDim int
		for _, part := range strings.Fields(sizes) {
			part = strings.ToLower(part)
			var w, h int
			if _, err := fmt.Sscanf(part, "%dx%d", &w, &h); err == nil {
				if w > maxDim {
					maxDim = w
				}
				if h > maxDim {
					maxDim = h
				}
			}
		}
		if maxDim >= 128 {
			score += 20
		} else if maxDim >= 64 {
			score += 12
		} else if maxDim >= 32 {
			score += 6
		}
	}
	return score
}

func downloadAsDataURL(ctx context.Context, client *http.Client, iconURL string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, iconURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "nav-hub-favicon/1.0")
	req.Header.Set("Accept", "image/svg+xml,image/*,*/*")

	res, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return "", fmt.Errorf("http %d", res.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(res.Body, maxBytes+1))
	if err != nil {
		return "", err
	}
	if len(body) == 0 {
		return "", fmt.Errorf("empty body")
	}
	if len(body) > maxBytes {
		return "", fmt.Errorf("icon too large")
	}

	ct := strings.ToLower(res.Header.Get("Content-Type"))
	if i := strings.Index(ct, ";"); i >= 0 {
		ct = strings.TrimSpace(ct[:i])
	}

	// SVG
	if strings.Contains(ct, "svg") || svgTagRe.Match(body) || looksLikeSVGURL(iconURL) {
		return svgToDataURL(string(body))
	}

	// Reject HTML error pages mistaken for icons
	if strings.Contains(ct, "text/html") || strings.Contains(ct, "application/json") {
		return "", fmt.Errorf("not an image")
	}

	mime := ct
	if mime == "" || mime == "application/octet-stream" {
		mime = sniffImageMIME(body, iconURL)
	}
	if !strings.HasPrefix(mime, "image/") {
		return "", fmt.Errorf("unsupported type %s", mime)
	}
	return "data:" + mime + ";base64," + base64.StdEncoding.EncodeToString(body), nil
}

func looksLikeSVGURL(u string) bool {
	path := strings.ToLower(u)
	if i := strings.Index(path, "?"); i >= 0 {
		path = path[:i]
	}
	return strings.HasSuffix(path, ".svg")
}

func svgToDataURL(raw string) (string, error) {
	s := strings.TrimSpace(raw)
	// Strip XML declaration
	if strings.HasPrefix(s, "<?xml") {
		if i := strings.Index(s, "?>"); i >= 0 {
			s = strings.TrimSpace(s[i+2:])
		}
	}
	if !svgTagRe.MatchString(s) {
		return "", fmt.Errorf("not svg")
	}
	// Ensure xmlns for isolated rendering in <img>
	if !strings.Contains(strings.ToLower(s[:min(200, len(s))]), "xmlns=") {
		re := regexp.MustCompile(`(?i)<svg\b`)
		s = re.ReplaceAllString(s, `<svg xmlns="http://www.w3.org/2000/svg"`)
	}
	// QueryEscape uses + for space; data URLs need %20 (encodeURIComponent style)
	enc := strings.ReplaceAll(url.QueryEscape(s), "+", "%20")
	return "data:image/svg+xml;charset=utf-8," + enc, nil
}

func sniffImageMIME(body []byte, iconURL string) string {
	if len(body) >= 8 && body[0] == 0x89 && body[1] == 'P' && body[2] == 'N' && body[3] == 'G' {
		return "image/png"
	}
	if len(body) >= 3 && body[0] == 0xff && body[1] == 0xd8 && body[2] == 0xff {
		return "image/jpeg"
	}
	if len(body) >= 6 && (string(body[:6]) == "GIF87a" || string(body[:6]) == "GIF89a") {
		return "image/gif"
	}
	if len(body) >= 12 && string(body[:4]) == "RIFF" && string(body[8:12]) == "WEBP" {
		return "image/webp"
	}
	if len(body) >= 4 && body[0] == 0x00 && body[1] == 0x00 && body[2] == 0x01 && body[3] == 0x00 {
		return "image/x-icon"
	}
	path := strings.ToLower(iconURL)
	if i := strings.Index(path, "?"); i >= 0 {
		path = path[:i]
	}
	switch {
	case strings.HasSuffix(path, ".png"):
		return "image/png"
	case strings.HasSuffix(path, ".jpg"), strings.HasSuffix(path, ".jpeg"):
		return "image/jpeg"
	case strings.HasSuffix(path, ".gif"):
		return "image/gif"
	case strings.HasSuffix(path, ".webp"):
		return "image/webp"
	case strings.HasSuffix(path, ".ico"):
		return "image/x-icon"
	}
	return ""
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
