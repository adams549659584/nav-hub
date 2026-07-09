#!/bin/sh
set -e

# 卷挂载会覆盖镜像里 chown 过的 /data，默认属 root。
# 以 root 启动时修正属主，再降权到 app，避免 SQLite CANTOPEN(14)「out of memory」。
if [ "$(id -u)" = "0" ]; then
  mkdir -p /data
  chown -R app:app /data
  exec su-exec app /app/nav-hub "$@"
fi

exec /app/nav-hub "$@"
