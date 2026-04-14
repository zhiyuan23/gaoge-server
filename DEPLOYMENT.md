# 🚀 gaoge-server 部署指南

> 从零开始部署高歌体育服务端到阿里云轻量服务器

---

## 📋 项目概览

### 技术栈

- **后端**: NestJS (TypeScript) + Prisma (PostgreSQL)
- **前端**: uni-app (Vue3 + TypeScript)
- **服务器**: 阿里云轻量应用服务器
- **域名**: gaoge.cc (备案中)

### 当前 API 接口

```
GET    /api/players      - 获取所有球员
GET    /api/players/:id  - 获取单个球员
POST   /api/players      - 创建球员
PATCH  /api/players/:id  - 更新球员
DELETE /api/players/:id  - 删除球员
```

---

## 🖥️ 第一步：阿里云服务器配置

### 1.1 连接服务器

```bash
# SSH 连接（替换为你的服务器 IP）
ssh root@your-server-ip

# 或使用阿里云控制台的工作台
```

### 1.2 系统更新

```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS/Alibaba Cloud Linux
yum update -y
```

### 1.3 安装必要软件

```bash
# 安装 Node.js (推荐 v20+)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 验证安装
node -v  # 应该显示 v20.x.x
npm -v

# 安装 pnpm
npm install -g pnpm

# 安装 PM2 (进程管理)
npm install -g pm2

# 安装 PostgreSQL (如果使用本地数据库)
apt install -y postgresql postgresql-contrib

# 安装 Nginx (反向代理)
apt install -y nginx
```

### 1.4 配置防火墙

```bash
# 开放必要端口
# 在阿里云控制台 → 防火墙 → 添加规则：
# - 80 (HTTP)
# - 443 (HTTPS)
# - 22 (SSH)
# - 3000 (应用端口，可选，如果直接用 Nginx 反向代理则不需要)
```

---

## 🗄️ 第二步：数据库设置

### 选项 A：使用阿里云 RDS PostgreSQL（推荐）

1. 在阿里云控制台创建 RDS PostgreSQL 实例
2. 获取连接字符串，格式：

   ```
   postgresql://user:password@host:port/database
   ```

3. 在安全组中允许服务器 IP 访问

### 选项 B：使用本地 PostgreSQL

```bash
# 启动 PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# 创建数据库
sudo -u postgres psql
CREATE DATABASE gaoge;
CREATE USER gaoge_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE gaoge TO gaoge_user;
\q

# 连接字符串
postgresql://gaoge_user:your_password@localhost:5432/gaoge
```

---

## 📦 第三步：部署 gaoge-server

### 3.1 上传代码到服务器

```bash
# 方式 1: 使用 Git
cd /var/www
git clone https://github.com/your-repo/gaoge-server.git
cd gaoge-server

# 方式 2: 本地构建后上传
# 在本地执行：
cd /Users/snow/Documents/Gaoge/gaoge-server
pnpm install
pnpm build
# 然后使用 scp 上传 dist 目录和 package.json
scp -r dist node_modules package.json .env root@your-server-ip:/var/www/gaoge-server
```

### 3.2 配置环境变量

```bash
cd /var/www/gaoge-server

# 创建 .env 文件
nano .env
```

**.env 内容**:

```env
# 服务端口
PORT=3000

# 数据库连接 (替换为你的实际连接字符串)
DATABASE_URL="postgresql://gaoge_user:your_password@localhost:5432/gaoge"

# 或者使用 Prisma Postgres
# DATABASE_URL="prisma+postgres://..."
```

### 3.3 安装依赖并初始化数据库

```bash
# 安装依赖
pnpm install

# 生成 Prisma 客户端
pnpm prisma generate

# 数据库迁移（创建表结构）
pnpm prisma migrate dev --name init

# 或者生产环境
pnpm prisma migrate deploy
```

### 3.4 启动服务

```bash
# 开发模式（不推荐生产环境）
pnpm start:dev

# 生产模式（使用 PM2）
pnpm build
pm2 start dist/main.js --name gaoge-server

# 设置开机自启
pm2 startup
pm2 save
```

### 3.5 查看日志

```bash
# PM2 日志
pm2 logs gaoge-server

# 实时查看
pm2 logs gaoge-server --lines 100 --follow
```

---

## 🌐 第四步：配置 Nginx 反向代理

### 4.1 创建 Nginx 配置

```bash
nano /etc/nginx/sites-available/gaoge-server
```

**配置文件内容**:

```nginx
server {
    listen 80;
    server_name api.gaoge.cc;  # 替换为你的域名

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4.2 启用配置

```bash
# 创建软链接
ln -s /etc/nginx/sites-available/gaoge-server /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

### 4.3 测试访问

```bash
# 应该能访问到
curl http://api.gaoge.cc/api/players
```

---

## 🔒 第五步：配置 HTTPS（备案完成后）

### 5.1 安装 Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 5.2 获取 SSL 证书

```bash
certbot --nginx -d api.gaoge.cc
```

### 5.3 自动续期

Certbot 会自动配置定时任务，验证：

```bash
certbot renew --dry-run
```

---

## 📱 第六步：配置 gaoge-app 前端

### 6.1 修改环境配置

编辑 `/Users/snow/Documents/Gaoge/gaoge-app/env/.env.development`:

```env
# 开发环境配置
VITE_APP_ENV=development

# 接口地址（替换为你的服务器地址）
VITE_API_BASE_URL=http://your-server-ip:3000
# 或者使用域名（备案后）
# VITE_API_BASE_URL=https://api.gaoge.cc

# 图片地址
VITE_IMAGE_BASE_URL=/static/images

# 跳转小程序环境
VITE_WX_ENV_VERSION=trial

# 删除 console
VITE_DROP_CONSOLE=false
```

### 6.2 修改生产环境配置

编辑 `/Users/snow/Documents/Gaoge/gaoge-app/env/.env.production`:

```env
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.gaoge.cc
VITE_IMAGE_BASE_URL=https://cdn.gaoge.cc/images
VITE_WX_ENV_VERSION=release
VITE_DROP_CONSOLE=true
```

### 6.3 创建 API 调用示例

在 `gaoge-app/src/api/players.ts` 创建：

```typescript
import { get, post, jsonPost } from './request'

export interface Player {
  id: string
  name: string
  number?: number
  position?: string
  team?: string
  country?: string
  heightCm?: number
  weightKg?: number
  birthDate?: string
  createdAt: string
  updatedAt: string
}

/**
 * 获取所有球员
 */
export const getPlayers = () => {
  return get<Player[]>('/api/players')
}

/**
 * 获取单个球员
 */
export const getPlayer = (id: string) => {
  return get<Player>(`/api/players/${id}`)
}

/**
 * 创建球员
 */
export const createPlayer = (data: Partial<Player>) => {
  return jsonPost<Player>('/api/players', data)
}

/**
 * 更新球员
 */
export const updatePlayer = (id: string, data: Partial<Player>) => {
  return jsonPost<Player>(`/api/players/${id}`, data)
}

/**
 * 删除球员
 */
export const deletePlayer = (id: string) => {
  return jsonPost(`/api/players/${id}`, { _method: 'DELETE' })
}
```

### 6.4 在页面中使用

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPlayers } from '@/api/players'
import type { Player } from '@/api/players'

const players = ref<Player[]>([])

onMounted(async () => {
  try {
    players.value = await getPlayers()
  } catch (error) {
    console.error('获取球员列表失败:', error)
  }
})
</script>

<template>
  <view>
    <view v-for="player in players" :key="player.id">
      <text>{{ player.name }} - {{ player.position }}</text>
    </view>
  </view>
</template>
```

---

## 🔧 常用命令速查

### 服务器管理

```bash
# 查看服务状态
pm2 status

# 重启服务
pm2 restart gaoge-server

# 停止服务
pm2 stop gaoge-server

# 查看日志
pm2 logs gaoge-server

# 查看资源占用
pm2 monit
```

### 数据库操作

```bash
# 查看数据库状态
pnpm prisma studio

# 创建新的迁移
pnpm prisma migrate dev --name add_new_field

# 重置数据库（危险！）
pnpm prisma migrate reset
```

### 日志查看

```bash
# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 系统日志
journalctl -u nginx -f
journalctl -u postgresql -f
```

---

## 🐛 常见问题排查

### 1. 服务无法访问

```bash
# 检查服务是否运行
pm2 status

# 检查端口是否监听
netstat -tlnp | grep 3000

# 检查防火墙
ufw status
# 或在阿里云控制台检查安全组
```

### 2. 数据库连接失败

```bash
# 检查 PostgreSQL 状态
systemctl status postgresql

# 测试连接
psql -h localhost -U gaoge_user -d gaoge
```

### 3. Nginx 配置错误

```bash
# 测试配置
nginx -t

# 重新加载配置
nginx -s reload
```

### 4. 权限问题

```bash
# 修改文件所有者
chown -R www-data:www-data /var/www/gaoge-server

# 修改文件权限
chmod -R 755 /var/www/gaoge-server
```

---

## 📊 监控和维护

### 添加监控

```bash
# 安装 PM2 Plus (可选)
pm2 plus

# 系统监控
apt install -y htop iotop
```

### 日志轮转

PM2 默认会处理日志轮转，也可以手动配置：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 备份策略

```bash
# 数据库备份
pg_dump -U gaoge_user gaoge > backup_$(date +%Y%m%d).sql

# 代码备份
tar -czf gaoge-server-backup-$(date +%Y%m%d).tar.gz /var/www/gaoge-server
```

---

## 🎯 下一步建议

1. **添加更多 API 模块**: 根据业务需求扩展 players 之外的模块
2. **实现用户认证**: 添加 JWT 或 Session 认证
3. **添加 API 文档**: 使用 Swagger/OpenAPI
4. **配置 CI/CD**: 使用 GitHub Actions 自动部署
5. **添加单元测试**: 保证代码质量
6. **性能优化**: 添加 Redis 缓存、数据库索引等

---

## 📞 需要帮助？

- NestJS 文档：<https://docs.nestjs.com>
- Prisma 文档：<https://www.prisma.io/docs>
- 阿里云文档：<https://help.aliyun.com>

---

*最后更新：2026-03-12*
