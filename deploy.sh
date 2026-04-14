#!/bin/bash

# 🚀 gaoge-server 一键部署脚本
# 适用于 Ubuntu/Debian 系统

set -e

echo "🚀 开始部署 gaoge-server..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
APP_NAME="gaoge-server"
APP_DIR="/var/www/gaoge-server"
PORT=3000
DB_NAME="gaoge"
DB_USER="gaoge_user"
DB_PASSWORD=$(openssl rand -base64 16)  # 生成随机密码

echo -e "${YELLOW}📋 配置信息:${NC}"
echo "  应用名称：$APP_NAME"
echo "  安装目录：$APP_DIR"
echo "  端口：$PORT"
echo "  数据库：$DB_NAME"
echo "  数据库用户：$DB_USER"
echo "  数据库密码：$DB_PASSWORD (请保存好！)"
echo ""

# 询问是否继续
read -p "继续部署？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "部署已取消"
    exit 1
fi

# 1. 系统更新
echo -e "${GREEN}[1/8]${NC} 更新系统..."
apt update && apt upgrade -y

# 2. 安装 Node.js
echo -e "${GREEN}[2/8]${NC} 安装 Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    echo "✅ Node.js 安装完成：$(node -v)"
else
    echo "⚠️  Node.js 已安装：$(node -v)"
fi

# 3. 安装 pnpm
echo -e "${GREEN}[3/8]${NC} 安装 pnpm..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
    echo "✅ pnpm 安装完成：$(pnpm -v)"
else
    echo "⚠️  pnpm 已安装：$(pnpm -v)"
fi

# 4. 安装 PM2
echo -e "${GREEN}[4/8]${NC} 安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo "✅ PM2 安装完成"
else
    echo "⚠️  PM2 已安装"
fi

# 5. 安装 PostgreSQL
echo -e "${GREEN}[5/8]${NC} 安装 PostgreSQL..."
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    echo "✅ PostgreSQL 安装完成"
else
    echo "⚠️  PostgreSQL 已安装"
fi

# 6. 配置数据库
echo -e "${GREEN}[6/8]${NC} 配置数据库..."
sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF
echo "✅ 数据库配置完成"

# 7. 安装 Nginx
echo -e "${GREEN}[7/8]${NC} 安装 Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    echo "✅ Nginx 安装完成"
else
    echo "⚠️  Nginx 已安装"
fi

# 8. 部署应用
echo -e "${GREEN}[8/8]${NC} 部署应用..."

# 创建目录
mkdir -p $APP_DIR

# 检查是否有 Git 仓库
if [ -d ".git" ]; then
    echo "📦 从当前目录复制代码..."
    cp -r . $APP_DIR/
else
    echo "❌ 请在项目根目录运行此脚本，或手动上传代码到 $APP_DIR"
    exit 1
fi

cd $APP_DIR

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 生成 Prisma 客户端
echo "🔧 生成 Prisma 客户端..."
pnpm prisma generate

# 创建 .env 文件
echo "⚙️  创建环境变量..."
cat > .env <<EOF
PORT=$PORT
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
EOF

# 数据库迁移
echo "🗄️  执行数据库迁移..."
pnpm prisma migrate dev --name init

# 构建项目
echo "🏗️  构建项目..."
pnpm build

# 使用 PM2 启动
echo "🚀 启动应用..."
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start dist/main.js --name $APP_NAME
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

# 配置 Nginx
echo "🌐 配置 Nginx..."
cat > /etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/$APP_NAME
nginx -t && systemctl restart nginx

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "📊 服务状态:"
pm2 status $APP_NAME
echo ""
echo "🔗 访问地址:"
echo "   http://localhost:$PORT"
echo "   http://your-server-ip/api/players"
echo ""
echo "💾 数据库信息 (请保存):"
echo "   数据库：$DB_NAME"
echo "   用户：$DB_USER"
echo "   密码：$DB_PASSWORD"
echo ""
echo "📋 常用命令:"
echo "   pm2 status              # 查看服务状态"
echo "   pm2 logs $APP_NAME      # 查看日志"
echo "   pm2 restart $APP_NAME   # 重启服务"
echo "   pm2 monit               # 监控资源"
echo ""
echo "📖 详细文档：DEPLOYMENT.md"
echo ""
