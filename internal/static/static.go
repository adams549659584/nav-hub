package static

import (
	"embed"
	"io"
	"io/fs"
	"net/http"
	"path"
	"strings"
)

// all:dist 递归嵌入 assets/ 等子目录；仅 dist/* 只会打进根层文件。
//
//go:embed all:dist
var dist embed.FS

func Handler() http.Handler {
	sub, err := fs.Sub(dist, "dist")
	if err != nil {
		panic(err)
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		name := strings.TrimPrefix(path.Clean("/"+r.URL.Path), "/")
		if name == "" || name == "." {
			name = "index.html"
		}
		if strings.HasPrefix(name, "..") {
			http.NotFound(w, r)
			return
		}

		// 不用 http.FileServer：目录请求会 301 到 "./"，在部分代理/路径下会环。
		if err := serveFile(w, r, sub, name); err != nil {
			if name != "index.html" {
				if err2 := serveFile(w, r, sub, "index.html"); err2 == nil {
					return
				}
			}
			http.NotFound(w, r)
		}
	})
}

func serveFile(w http.ResponseWriter, r *http.Request, fsys fs.FS, name string) error {
	f, err := fsys.Open(name)
	if err != nil {
		return err
	}
	defer f.Close()

	st, err := f.Stat()
	if err != nil {
		return err
	}
	if st.IsDir() {
		return fs.ErrNotExist
	}

	rs, ok := f.(io.ReadSeeker)
	if !ok {
		return fs.ErrInvalid
	}
	http.ServeContent(w, r, path.Base(name), st.ModTime(), rs)
	return nil
}
