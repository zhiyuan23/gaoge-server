#!/bin/bash

echo "🔧 创建数据库脚本"
echo "========================"

# 检查 PostgreSQL 是否安装
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL 未安装"
    echo "请先安装 PostgreSQL:"
    echo "  Mac: brew install postgresql"
    echo "  Ubuntu: sudo apt install postgresql"
    echo "  Windows: 下载 PostgreSQL 安装包"
    exit 1
fi

# 检查 PostgreSQL 是否运行
if ! pg_isready &> /dev/null; then
    echo "⚠️  PostgreSQL 未运行，尝试启动..."
    
    # 尝试启动 PostgreSQL
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # Mac
        brew services start postgresql
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start postgresql
    else
        echo "❌ 无法自动启动 PostgreSQL，请手动启动"
        exit 1
    fi
    
    # 等待 PostgreSQL 启动
    sleep 3
fi

# 读取环境变量
if [ -f .env ]; then
    source .env
elif [ -f .env.local ]; then
    source .env.local
else
    echo "❌ 找不到环境变量文件 (.env 或 .env.local)"
    echo "请先创建环境变量文件: cp .env.local .env"
    exit 1
fi

# 解析 DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL 未配置"
    exit 1
fi

# 从 DATABASE_URL 提取信息
# 格式: postgresql://user:password@host:port/database?schema=public
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*@[^:]*:\([^/]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "📊 数据库信息:"
echo "  用户: $DB_USER"
echo "  主机: $DB_HOST"
echo "  端口: $DB_PORT"
echo "  数据库: $DB_NAME"

# 创建数据库
echo ""
echo "📦 创建数据库..."
psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ 数据库创建成功"
else
    echo "⚠️  数据库可能已存在，继续..."
fi

# 创建用户（如果需要）
echo ""
echo "👤 创建数据库用户..."
psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ 用户创建成功"
else
    echo "⚠️  用户可能已存在，继续..."
fi

# 授予权限
echo ""
echo "🔑 授予权限..."
psql -h $DB_HOST -p $DB_PORT -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null
psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null

echo "✅ 权限授予成功"

echo ""
echo "🎉 数据库设置完成！"
echo "========================"
echo "接下来运行:"
echo "1. npx prisma migrate dev --name init"
echo "2. npm run start:dev"
echo "3. 访问: http://localhost:3000"