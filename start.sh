#!/bin/bash

echo "🚀 Gaoge Server 启动脚本"
echo "========================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    echo "请先安装 Node.js (>=18): https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ 需要 Node.js 18 或更高版本，当前版本: $(node -v)"
    exit 1
fi
echo "✅ Node.js 版本 $(node -v)"

# 检查环境变量文件
if [ ! -f .env.local ] && [ ! -f .env ]; then
    echo "⚠️  找不到 .env.local 或 .env 文件"
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo "✅ 已从 .env.example 创建 .env.local"
        echo "   请编辑 .env.local 后重新运行："
        echo "   1. WECHAT_APPID=你的小程序AppID"
        echo "   2. WECHAT_APPSECRET=你的小程序AppSecret"
        echo "   3. DATABASE_URL=你的数据库连接"
        exit 1
    else
        echo "❌ 找不到环境变量模板 (.env.example)"
        exit 1
    fi
fi

ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE=".env"
fi

# 检查数据库配置
if grep -q "your-wechat-appid" "$ENV_FILE"; then
    echo "❌ 请先配置 $ENV_FILE 中的微信小程序信息"
    echo "   编辑 $ENV_FILE，填入真实的 AppID 和 AppSecret"
    exit 1
fi

# 检查依赖
echo ""
echo "📦 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装成功"
else
    echo "✅ 依赖已安装"
fi

# 检查 Prisma 客户端
echo ""
echo "🔧 检查 Prisma..."
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Prisma schema 文件不存在"
    exit 1
fi

# 生成 Prisma 客户端
echo "生成 Prisma 客户端..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Prisma 客户端生成失败"
    exit 1
fi
echo "✅ Prisma 客户端生成成功"

# 检查数据库迁移
echo ""
echo "🗄️  检查数据库迁移..."
if [ -f "prisma/migrations" ]; then
    echo "已有迁移文件"
else
    echo "首次运行，需要创建数据库迁移"
    read -p "是否创建数据库迁移? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npx prisma migrate dev --name init
        if [ $? -ne 0 ]; then
            echo "❌ 数据库迁移失败"
            echo "请先创建数据库: ./scripts/create-database.sh"
            exit 1
        fi
        echo "✅ 数据库迁移成功"
    else
        echo "⚠️  跳过数据库迁移"
    fi
fi

# 启动服务
echo ""
echo "🚀 启动服务..."
echo "========================"
echo "服务将启动在: http://localhost:3000"
echo "API 前缀: /api"
echo "登录接口: POST /auth/wechat-login"
echo ""
echo "按 Ctrl+C 停止服务"
echo "========================"

# 启动开发服务器
npm run start:dev
