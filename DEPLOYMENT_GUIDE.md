# 部署指南 - 让小程序可以调用

## 🚀 快速开始

### 1. 环境准备

```bash
# 1. 安装 Node.js (>=18)
node --version

# 2. 安装 PostgreSQL 数据库
# Mac: brew install postgresql
# Ubuntu: sudo apt install postgresql
# Windows: 下载 PostgreSQL 安装包

# 3. 启动 PostgreSQL
# Mac: brew services start postgresql
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.local .env

# 编辑 .env 文件
nano .env
```

**`.env` 文件内容：**
```bash
# 微信小程序配置（必须）
WECHAT_APPID=你的小程序AppID
WECHAT_APPSECRET=你的小程序AppSecret

# 数据库配置（必须）
DATABASE_URL="postgresql://postgres:password@localhost:5432/gaoge_db?schema=public"
# 格式：postgresql://用户名:密码@主机:端口/数据库名

# JWT配置（必须）
JWT_SECRET=your-jwt-secret-key-change-this-in-production
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this-in-production
JWT_EXPIRES_IN=2h
REFRESH_TOKEN_EXPIRES_IN=7d

# 应用配置
APP_PORT=3000
APP_NAME=gaoge-server
NODE_ENV=development

# 安全配置
CORS_ORIGIN=http://localhost:9527
```

### 3. 创建数据库

```bash
# 进入 PostgreSQL
psql postgres

# 在 PostgreSQL 中执行：
CREATE DATABASE gaoge_db;
CREATE USER gaoge_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE gaoge_db TO gaoge_user;
\q

# 或者使用脚本
./scripts/create-database.sh
```

### 4. 数据库迁移

```bash
# 1. 生成 Prisma 客户端
npx prisma generate

# 2. 创建数据库迁移
npx prisma migrate dev --name init

# 3. 查看数据库（可选）
npx prisma studio
```

### 5. 启动服务

```bash
# 开发模式（热重载）
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

## 📱 小程序调用

### 1. 获取微信小程序 AppID 和 AppSecret

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入 **开发** → **开发设置**
3. 获取 **AppID** 和 **AppSecret**

### 2. 小程序端代码

```javascript
// pages/login/login.js
Page({
  data: {
    userInfo: null,
    token: null
  },

  // 微信登录
  onLogin() {
    wx.login({
      success: (res) => {
        if (res.code) {
          this.wechatLogin(res.code)
        }
      }
    })
  },

  // 调用后端接口
  wechatLogin(code) {
    wx.request({
      url: 'http://localhost:3000/auth/wechat-login',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        code: code,
        nickname: '用户昵称',
        avatarUrl: '用户头像URL'
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const { user, accessToken, refreshToken } = res.data
          
          // 存储到本地
          wx.setStorageSync('userInfo', user)
          wx.setStorageSync('accessToken', accessToken)
          wx.setStorageSync('refreshToken', refreshToken)
          
          console.log('登录成功:', user)
          wx.showToast({ title: '登录成功' })
        }
      },
      fail: (err) => {
        console.error('登录失败:', err)
        wx.showToast({ title: '登录失败', icon: 'error' })
      }
    })
  },

  // 获取用户信息（需要 token）
  getUserProfile() {
    const token = wx.getStorageSync('accessToken')
    
    wx.request({
      url: 'http://localhost:3000/auth/profile',
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('用户信息:', res.data)
      }
    })
  }
})
```

### 3. 配置小程序域名

在微信公众平台配置服务器域名：
1. 进入 **开发** → **开发设置** → **服务器域名**
2. 添加以下域名：
   - **request 合法域名**: `http://localhost:3000` (开发环境)
   - **uploadFile 合法域名**: `http://localhost:3000`
   - **downloadFile 合法域名**: `http://localhost:3000`

## 🔧 常见问题

### 1. 数据库连接失败
```bash
# 检查 PostgreSQL 是否运行
ps aux | grep postgres

# 检查连接字符串
echo $DATABASE_URL

# 手动测试连接
psql "postgresql://postgres:password@localhost:5432/gaoge_db"
```

### 2. 微信登录失败
- 检查 `.env` 中的 `WECHAT_APPID` 和 `WECHAT_APPSECRET`
- 确认小程序已发布或处于开发模式
- 检查网络连接

### 3. CORS 跨域问题
确保 `.env` 中的 `CORS_ORIGIN` 包含小程序域名：
```bash
CORS_ORIGIN=http://localhost:9527,https://your-miniprogram-domain.com
```

### 4. 端口被占用
```bash
# 查看占用端口的进程
lsof -i :3000

# 杀掉进程
kill -9 <PID>

# 或修改端口
APP_PORT=3001
```

## 📊 测试 API

### 使用 curl 测试
```bash
# 测试微信登录
curl -X POST http://localhost:3000/auth/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code": "test_code", "nickname": "测试用户"}'

# 测试刷新 token
curl -X POST http://localhost:3000/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your_refresh_token"}'
```

### 使用 Postman
1. 导入 `postman_collection.json` (如果有)
2. 设置环境变量：
   - `base_url`: `http://localhost:3000`
   - `token`: 登录后获取的 token

## 🚢 生产部署

### 1. 服务器要求
- Node.js 18+
- PostgreSQL 12+
- Nginx (推荐)

### 2. 部署步骤
```bash
# 1. 克隆代码
git clone <your-repo>
cd gaoge-server

# 2. 安装依赖
npm install --production

# 3. 配置生产环境变量
cp .env.production .env

# 4. 构建
npm run build

# 5. 使用 PM2 管理进程
npm install -g pm2
pm2 start ecosystem.config.js --only gaoge-server

# 6. 设置开机自启
pm2 startup
pm2 save
```

### 3. Nginx 配置
```nginx
server {
    listen 80;
    server_name api.gaoge.cc;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📞 获取帮助

1. **查看日志**
```bash
# 开发日志
npm run start:dev 2>&1 | tee logs/development.log

# 生产日志
pm2 logs gaoge-server
```

2. **检查服务状态**
```bash
# 检查服务是否运行
curl http://localhost:3000/health

# 检查数据库连接
npx prisma db pull
```

3. **调试微信登录**
```bash
# 查看微信 API 调用日志
tail -f logs/wechat.log
```

---

**快速开始命令总结：**
```bash
# 1. 配置环境变量
cp .env.local .env
# 编辑 .env，填入微信小程序配置

# 2. 创建数据库
createdb gaoge_db

# 3. 数据库迁移
npx prisma migrate dev --name init

# 4. 启动服务
npm run start:dev

# 5. 测试
curl http://localhost:3000/auth/wechat-login
```

现在小程序可以调用 `http://localhost:3000` 的 API 了！
