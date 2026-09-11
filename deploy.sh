#!/usr/bin/env bash
#
# 命运之轮 Mystic Tarot — Linux 服务器一键部署脚本
#
# 在服务器上执行：
#   git clone https://github.com/lyian6714-del/taro.git /opt/tarot
#   bash /opt/tarot/deploy.sh
#
set -euo pipefail

REPO="https://github.com/lyian6714-del/taro.git"
APP_DIR="/opt/tarot"
PORT="${PORT:-3000}"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

[ "$(id -u)" = "0" ] || { echo "请以 root 运行：sudo bash deploy.sh"; exit 1; }

log "1/6 安装 git / curl"
if command -v apt-get >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y >/dev/null
    apt-get install -y git curl ca-certificates >/dev/null
elif command -v yum >/dev/null 2>&1; then
    yum install -y git curl ca-certificates >/dev/null
else
    echo "未识别的包管理器，请先手动安装 git 和 curl 后重试"; exit 1
fi

log "2/6 检查 Node.js 版本（代码需要 >=18）"
NODE_MAJOR=0
command -v node >/dev/null 2>&1 && NODE_MAJOR=$(node -v | sed 's/^v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "当前 Node: $(node -v 2>/dev/null || echo '未安装')，开始安装 Node 20 ..."
    if command -v apt-get >/dev/null 2>&1; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
        apt-get install -y nodejs >/dev/null
    else
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - >/dev/null
        yum install -y nodejs >/dev/null
    fi
fi
echo "Node 版本: $(node -v)"

log "3/6 拉取代码到 $APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
    git -C "$APP_DIR" pull --ff-only
else
    mkdir -p "$(dirname "$APP_DIR")"
    git clone "$REPO" "$APP_DIR"
fi

log "4/6 安装依赖（走国内 npm 镜像加速）"
cd "$APP_DIR"
npm config set registry https://registry.npmmirror.com
npm install --omit=dev

log "5/6 配置环境变量 .env"
if [ -f "$APP_DIR/.env" ]; then
    echo ".env 已存在，跳过。如需修改 Key：nano $APP_DIR/.env 然后 pm2 restart tarot"
else
    printf '请粘贴你的 DeepSeek API Key（sk-...，输入时不显示）: '
    read -rs KEY
    echo
    [ -n "$KEY" ] || { echo "Key 不能为空，已中止"; exit 1; }
    printf 'DEEPSEEK_API_KEY=%s\nPORT=%s\n' "$KEY" "$PORT" > "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
    echo "已写入 $APP_DIR/.env（权限 600，仅 root 可读）"
fi

log "6/6 用 pm2 常驻运行（崩溃自动重启 + 开机自启）"
npm install -g pm2 >/dev/null
pm2 delete tarot >/dev/null 2>&1 || true
pm2 start server.js --name tarot
pm2 save >/dev/null
# 让 pm2 随系统启动（不同发行版略有差异，失败不影响当前运行）
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

log "放行防火墙端口 $PORT"
if command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --permanent --add-port="${PORT}/tcp" >/dev/null 2>&1 || true
    firewall-cmd --reload >/dev/null 2>&1 || true
elif command -v ufw >/dev/null 2>&1; then
    ufw allow "${PORT}/tcp" >/dev/null 2>&1 || true
fi

IP=$(curl -s -m 10 https://api.ipify.org || echo "<你的服务器公网IP>")

cat <<EOF

========================================================
 部署完成
--------------------------------------------------------
 本地自测： curl -I http://127.0.0.1:$PORT
 外网访问： http://$IP:$PORT
 查看日志： pm2 logs tarot
 重启服务： pm2 restart tarot
========================================================
 如果外网打不开，去云服务商控制台的【安全组 / 防火墙】
 里放行 TCP $PORT 端口。
========================================================
EOF
