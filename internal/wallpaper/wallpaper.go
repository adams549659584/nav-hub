package wallpaper

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"
)

// Item is a unified wallpaper entry for the frontend library.
type Item struct {
	ID        string `json:"id"`
	Title     string `json:"title,omitempty"`
	Thumb     string `json:"thumb"`
	Src       string `json:"src"`
	Type      string `json:"type"` // image | video | color
	Source    string `json:"source"`
	Copyright string `json:"copyright,omitempty"`
	PageURL   string `json:"pageUrl,omitempty"`
}

type ListResult struct {
	Items   []Item `json:"items"`
	Page    int    `json:"page"`
	Size    int    `json:"size"`
	HasMore bool   `json:"hasMore"`
	Source  string `json:"source"`
}

type SourceInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func Sources() []SourceInfo {
	return []SourceInfo{
		{ID: "solid", Name: "纯色"},
		{ID: "bing", Name: "必应壁纸"},
		{ID: "dynamic", Name: "动态壁纸"},
		{ID: "wallhaven", Name: "Wallhaven"},
		{ID: "deepin", Name: "Deepin"},
		{ID: "custom", Name: "自定义壁纸"},
	}
}

var httpClient = &http.Client{Timeout: 18 * time.Second}

// simple in-memory cache
type cacheEntry struct {
	at   time.Time
	data ListResult
}

var (
	cacheMu sync.Mutex
	cache   = map[string]cacheEntry{}
	cacheTTL = 30 * time.Minute
)

func getCache(key string) (ListResult, bool) {
	cacheMu.Lock()
	defer cacheMu.Unlock()
	e, ok := cache[key]
	if !ok || time.Since(e.at) > cacheTTL {
		return ListResult{}, false
	}
	return e.data, true
}

func setCache(key string, data ListResult) {
	cacheMu.Lock()
	defer cacheMu.Unlock()
	cache[key] = cacheEntry{at: time.Now(), data: data}
}

func List(source string, page, size int, query string) (ListResult, error) {
	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = 16
	}
	if size > 48 {
		size = 48
	}
	source = strings.ToLower(strings.TrimSpace(source))
	if source == "" {
		source = "bing"
	}

	key := fmt.Sprintf("%s|%d|%d|%s", source, page, size, query)
	if cached, ok := getCache(key); ok {
		return cached, nil
	}

	var (
		res ListResult
		err error
	)
	switch source {
	case "bing":
		res, err = listBing(page, size)
	case "wallhaven":
		res, err = listWallhaven(page, size, query)
	case "deepin":
		res, err = listDeepin(page, size)
	case "dynamic":
		res, err = listDynamic(page, size)
	case "solid":
		res, err = listSolid(page, size)
	case "custom":
		res = ListResult{Items: []Item{}, Page: page, Size: size, HasMore: false, Source: "custom"}
	default:
		return ListResult{}, fmt.Errorf("unknown source %q", source)
	}
	if err != nil {
		return ListResult{}, err
	}
	res.Page = page
	res.Size = size
	res.Source = source
	if res.Items == nil {
		res.Items = []Item{}
	}
	setCache(key, res)
	return res, nil
}

// --- Bing (official HPImageArchive) ---

func listBing(page, size int) (ListResult, error) {
	all, err := fetchBingAll()
	if err != nil {
		return ListResult{}, err
	}
	start := (page - 1) * size
	if start >= len(all) {
		return ListResult{Items: []Item{}, HasMore: false}, nil
	}
	end := start + size
	if end > len(all) {
		end = len(all)
	}
	return ListResult{Items: all[start:end], HasMore: end < len(all)}, nil
}

func fetchBingAll() ([]Item, error) {
	// idx=0 n=8 + idx=7 n=8 covers ~15 unique days
	a, err := fetchBing(0, 8)
	if err != nil {
		return nil, err
	}
	b, err := fetchBing(7, 8)
	if err != nil {
		return a, nil
	}
	seen := map[string]bool{}
	var all []Item
	for _, it := range append(a, b...) {
		if seen[it.ID] {
			continue
		}
		seen[it.ID] = true
		all = append(all, it)
	}
	return all, nil
}

func fetchBing(idx, n int) ([]Item, error) {
	u := fmt.Sprintf("https://www.bing.com/HPImageArchive.aspx?format=js&idx=%d&n=%d&mkt=zh-CN", idx, n)
	body, err := httpGet(u)
	if err != nil {
		return nil, err
	}
	var raw struct {
		Images []struct {
			URL       string `json:"url"`
			URLBase   string `json:"urlbase"`
			Copyright string `json:"copyright"`
			Title     string `json:"title"`
			EndDate   string `json:"enddate"`
		} `json:"images"`
	}
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, err
	}
	items := make([]Item, 0, len(raw.Images))
	for _, img := range raw.Images {
		src := img.URL
		if strings.HasPrefix(src, "/") {
			src = "https://www.bing.com" + src
		}
		id := img.URLBase
		if id == "" {
			id = img.EndDate
		}
		thumb := src
		if strings.Contains(src, "pid=hp") {
			if strings.Contains(src, "?") {
				thumb = src + "&w=360&h=202"
			}
		}
		title := img.Title
		if title == "" {
			title = img.Copyright
		}
		items = append(items, Item{
			ID:        "bing:" + id,
			Title:     title,
			Thumb:     thumb,
			Src:       src,
			Type:      "image",
			Source:    "bing",
			Copyright: img.Copyright,
			PageURL:   "https://www.bing.com/",
		})
	}
	return items, nil
}

// --- Wallhaven ---

func listWallhaven(page, size int, query string) (ListResult, error) {
	q := url.Values{}
	q.Set("categories", "111")
	q.Set("purity", "100") // SFW only
	q.Set("sorting", "toplist")
	q.Set("atleast", "1920x1080")
	q.Set("page", strconv.Itoa(page))
	if query != "" {
		q.Set("q", query)
		q.Set("sorting", "relevance")
	}
	// wallhaven ignores page size; fixed ~24
	u := "https://wallhaven.cc/api/v1/search?" + q.Encode()
	body, err := httpGet(u)
	if err != nil {
		return ListResult{}, err
	}
	var raw struct {
		Data []struct {
			ID   string `json:"id"`
			URL  string `json:"url"`
			Path string `json:"path"`
			Thumbs struct {
				Large  string `json:"large"`
				Small  string `json:"small"`
				Original string `json:"original"`
			} `json:"thumbs"`
			Resolution string `json:"resolution"`
		} `json:"data"`
		Meta struct {
			CurrentPage int `json:"current_page"`
			LastPage    int `json:"last_page"`
		} `json:"meta"`
	}
	if err := json.Unmarshal(body, &raw); err != nil {
		return ListResult{}, err
	}
	items := make([]Item, 0, len(raw.Data))
	for i, d := range raw.Data {
		if i >= size {
			break
		}
		thumb := d.Thumbs.Small
		if thumb == "" {
			thumb = d.Thumbs.Large
		}
		items = append(items, Item{
			ID:      "wallhaven:" + d.ID,
			Title:   d.Resolution + " · " + d.ID,
			Thumb:   thumb,
			Src:     d.Path,
			Type:    "image",
			Source:  "wallhaven",
			PageURL: d.URL,
		})
	}
	return ListResult{
		Items:   items,
		HasMore: raw.Meta.CurrentPage < raw.Meta.LastPage,
	}, nil
}

// --- Deepin static wallpapers (github raw) ---

const deepinBase = "https://raw.githubusercontent.com/linuxdeepin/deepin-wallpapers/master/"

var deepinStatic = []string{
	"deepin/Colorful-Abstraction01.jpg",
	"deepin/Colorful-Abstraction02.jpg",
	"deepin/Colorful-Abstraction03.jpg",
	"deepin/Glossy-Gradient.jpg",
	"deepin/deepin-theme-3.jpg",
	"deepin/flow-dark.png",
	"deepin/flow-light.png",
	"deepin/hazy-color-dark.jpg",
	"deepin/hazy-color-light.jpg",
	"deepin/macaron-dark.png",
	"deepin/macaron-light.png",
	"deepin/organic-glass-dark.jpg",
	"deepin/organic-glass-light.jpg",
	"deepin/square-dark.jpg",
	"deepin/square-light.jpg",
}

func listDeepin(page, size int) (ListResult, error) {
	return paginateStatic(deepinStatic, "deepin", "image", page, size, func(path string) Item {
		name := path
		if i := strings.LastIndex(path, "/"); i >= 0 {
			name = path[i+1:]
		}
		src := deepinBase + path
		return Item{
			ID:     "deepin:" + path,
			Title:  strings.TrimSuffix(name, pathExt(name)),
			Thumb:  src,
			Src:    src,
			Type:   "image",
			Source: "deepin",
		}
	})
}

// --- Dynamic (Deepin live wallpapers) ---

type liveItem struct {
	File  string
	Thumb string
	Title string
}

var deepinLive = []liveItem{
	// default.mp4 无独立缩略图，用一张静态图作预览
	{File: "deepin-livewallpapers/default.mp4", Thumb: "deepin/organic-glass-dark.jpg", Title: "Default"},
	{File: "deepin-livewallpapers/Campfire_Camping_In_The_Forest.mp4", Thumb: "deepin-livewallpapers/thumbnails/Campfire_Camping_In_The_Forest.png", Title: "Campfire"},
	{File: "deepin-livewallpapers/Cosmic_Galaxy_Nebula.mp4", Thumb: "deepin-livewallpapers/thumbnails/Cosmic_Galaxy_Nebula.png", Title: "Cosmic Galaxy"},
	{File: "deepin-livewallpapers/Sailfish_In_The_Deep_Sea.mp4", Thumb: "deepin-livewallpapers/thumbnails/Sailfish_In_The_Deep_Sea.png", Title: "Sailfish"},
	{File: "deepin-livewallpapers/Summer_Night_Breeze.mp4", Thumb: "deepin-livewallpapers/thumbnails/Summer_Night_Breeze.png", Title: "Summer Night"},
}

func listDynamic(page, size int) (ListResult, error) {
	total := len(deepinLive)
	start := (page - 1) * size
	if start >= total {
		return ListResult{Items: []Item{}, HasMore: false}, nil
	}
	end := start + size
	if end > total {
		end = total
	}
	items := make([]Item, 0, end-start)
	for _, v := range deepinLive[start:end] {
		src := deepinBase + v.File
		thumb := src
		if v.Thumb != "" {
			thumb = deepinBase + v.Thumb
		}
		items = append(items, Item{
			ID:     "dynamic:" + v.File,
			Title:  v.Title,
			Thumb:  thumb,
			Src:    src,
			Type:   "video",
			Source: "dynamic",
		})
	}
	return ListResult{Items: items, HasMore: end < total}, nil
}

// --- Solid colors ---

var solidColors = []struct {
	ID    string
	Title string
	Color string
}{
	{"solid:black", "纯黑", "#0a0a0a"},
	{"solid:slate", "深灰", "#1e293b"},
	{"solid:navy", "午夜蓝", "#0f172a"},
	{"solid:indigo", "靛蓝", "#1e1b4b"},
	{"solid:forest", "墨绿", "#052e16"},
	{"solid:wine", "酒红", "#450a0a"},
	{"solid:charcoal", "炭灰", "#171717"},
	{"solid:blue", "Deepin 蓝", "#1e3a5f"},
	{"solid:teal", "青绿", "#134e4a"},
	{"solid:purple", "紫", "#3b0764"},
	{"solid:orange", "暖橙底", "#431407"},
	{"solid:rose", "玫瑰底", "#4c0519"},
}

func listSolid(page, size int) (ListResult, error) {
	// also include deepin solid images
	type solid struct {
		id, title, src, typ string
	}
	var all []solid
	for _, c := range solidColors {
		all = append(all, solid{c.ID, c.Title, c.Color, "color"})
	}
	for _, path := range []string{
		"deepin-solidwallpapers/mono-black.png",
		"deepin-solidwallpapers/mono-blue.png",
		"deepin-solidwallpapers/mono-blue-green.png",
		"deepin-solidwallpapers/mono-blue-purple.png",
		"deepin-solidwallpapers/mono-dark-green.png",
		"deepin-solidwallpapers/mono-dark-red.png",
		"deepin-solidwallpapers/mono-light-green.png",
		"deepin-solidwallpapers/mono-orange.png",
		"deepin-solidwallpapers/mono-orange-red.png",
		"deepin-solidwallpapers/mono-rose-red.png",
	} {
		name := path[strings.LastIndex(path, "/")+1:]
		all = append(all, solid{
			"solid-img:" + path,
			strings.TrimSuffix(name, pathExt(name)),
			deepinBase + path,
			"image",
		})
	}

	start := (page - 1) * size
	if start >= len(all) {
		return ListResult{Items: []Item{}, HasMore: false}, nil
	}
	end := start + size
	if end > len(all) {
		end = len(all)
	}
	items := make([]Item, 0, end-start)
	for _, s := range all[start:end] {
		items = append(items, Item{
			ID:     s.id,
			Title:  s.title,
			Thumb:  s.src,
			Src:    s.src,
			Type:   s.typ,
			Source: "solid",
		})
	}
	return ListResult{Items: items, HasMore: end < len(all)}, nil
}

func paginateStatic(paths []string, source, typ string, page, size int, mapFn func(string) Item) (ListResult, error) {
	start := (page - 1) * size
	if start >= len(paths) {
		return ListResult{Items: []Item{}, HasMore: false}, nil
	}
	end := start + size
	if end > len(paths) {
		end = len(paths)
	}
	items := make([]Item, 0, end-start)
	for _, p := range paths[start:end] {
		items = append(items, mapFn(p))
	}
	_ = source
	_ = typ
	return ListResult{Items: items, HasMore: end < len(paths)}, nil
}

func pathExt(name string) string {
	if i := strings.LastIndex(name, "."); i >= 0 {
		return name[i:]
	}
	return ""
}

func httpGet(u string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "nav-hub/1.0 (+https://github.com/adams549659584/nav-hub)")
	req.Header.Set("Accept", "application/json")
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return nil, fmt.Errorf("upstream %s: %s", resp.Status, string(b))
	}
	return io.ReadAll(io.LimitReader(resp.Body, 4<<20))
}
