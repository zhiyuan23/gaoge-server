# 登录功能实现文档

## 🎯 功能概述

已实现完整的微信小程序登录功能，支持：
- 微信登录（通过 `uni.login` 获取 openid）
- 手机号登录（解密微信加密手机号）
- JWT Token 认证
- Refresh Token 机制
- 用户信息管理

## 📁 新增文件结构

```
src/
├── modules/auth/                    # 登录认证模块
│   ├── controllers/                 # 控制器
│   │   └── auth.controller.ts       # 认证接口
│   ├── dto/                        # 数据传输对象
│   │   └── login.dto.ts            # 登录DTO
│   ├── guards/                     # 守卫
│   │   └── jwt-auth.guard.ts       # JWT认证守卫
│   ├── services/                   # 服务层
│   │   └── auth.service.ts         # 认证服务
│   └── auth.module.ts              # 认证模块
└── common/wechat/                  # 微信服务模块
    ├── wechat.service.ts           # 微信服务
    └── wechat.module.ts            # 微信模块
```

## 🗄️ 数据库表设计

### User 表
| 字段 | 类型 | 描述 |
|------|------|------|
| id | String | 主键 |
| openid | String (unique) | 微信openid |
| unionid | String | 微信unionid |
| nickname | String | 用户昵称 |
| avatarUrl | String | 用户头像 |
| phoneNumber | String | 手机号 |
| email | String | 邮箱 |
| lastLoginAt | DateTime | 最后登录时间 |
| isActive | Boolean | 是否激活 |
| isDeleted | Boolean | 是否删除 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### RefreshToken 表
| 字段 | 类型 | 描述 |
|------|------|------|
| id | String | 主键 |
| token | String (unique) | refresh token |
| userId | String | 用户ID |
| expiresAt | DateTime | 过期时间 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

## 📖 API 接口

### 1. 微信登录
```
POST /api/v1/auth/wechat-login
```

**请求体：**
```json
{
  "code": "0816xxxxxxxxxxxxxx",
  "nickname": "用户昵称",
  "avatarUrl": "https://thirdwx.qlogo.cn/xxx"
}
```

**响应：**
```json
{
  "user": {
    "id": "clxxxxxx",
    "openid": "o7kdt5R7-xxxxxxxxxxxxxxxx",
    "nickname": "用户昵称",
    "avatarUrl": "https://thirdwx.qlogo.cn/xxx",
    "phoneNumber": null,
    "email": null,
    "lastLoginAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "access_token_here",
  "refreshToken": "refresh_token_here",
  "expiresIn": 7200
}
```

### 2. 手机号登录
```
POST /api/v1/auth/phone-login
```

**请求体：**
```json
{
  "code": "0816xxxxxxxxxxxxxx",
  "encryptedData": "CiyLU1Aw2KjvrjMdj8YKliAjtP4gsMZ...",
  "iv": "r7BXXKkLb8qrSNn05n0qiA=="
}
```

### 3. 刷新Token
```
POST /api/v1/auth/refresh-token
```

**请求体：**
```json
{
  "refreshToken": "refresh_token_here"
}
```

### 4. 退出登录
```
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

**请求体：**
```json
{
  "userId": "clxxxxxx"
}
```

## 🔧 配置步骤

### 1. 环境变量配置
复制 `.env.example` 为 `.env.local` 并修改：
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：
```bash
# 微信小程序配置
WECHAT_APPID=你的小程序AppID
WECHAT_APPSECRET=你的小程序AppSecret

# JWT配置
JWT_SECRET=your-jwt-secret-key-change-this-in-production
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this-in-production

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/gaoge_db?schema=public
```

### 2. 数据库迁移
```bash
# 生成 Prisma 客户端
npx prisma generate

# 创建数据库迁移
npx prisma migrate dev --name add_auth_tables
```

### 3. 安装依赖
```bash
npm install axios crypto
```

## 💻 小程序端调用示例

### uni-app 微信登录
```javascript
// 小程序端调用
uni.login({
  success: (res) => {
    if (res.code) {
      uni.request({
        url: 'http://localhost:3000/auth/wechat-login',
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          code: res.code,
          nickname: '用户昵称',
          avatarUrl: '用户头像URL'
        },
        success: (loginRes) => {
          console.log('登录成功:', loginRes.data);
          
          // 存储token
          uni.setStorageSync('accessToken', loginRes.data.accessToken);
          uni.setStorageSync('refreshToken', loginRes.data.refreshToken);
          uni.setStorageSync('userInfo', loginRes.data.user);
        },
        fail: (error) => {
          console.error('登录失败:', error);
        }
      });
    }
  }
});
```

## 🚀 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

## 🧪 测试

服务启动后，使用 Postman 或 curl 测试：

```bash
# 测试微信登录
curl -X POST http://localhost:3000/auth/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code": "test_code", "nickname": "测试用户"}'
```

## 🔍 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `.env` 中的 `DATABASE_URL`
   - 确认数据库服务已启动

2. **微信登录失败**
   - 检查 `WECHAT_APPID` 和 `WECHAT_APPSECRET` 是否正确
   - 确认小程序已发布或处于开发模式

3. **JWT 验证失败**
   - 确保请求头中包含 `Authorization: Bearer <token>`
   - 检查 token 是否过期

## 📝 下一步开发建议

1. **完善用户管理** - 用户信息修改、绑定手机/邮箱
2. **权限控制** - 基于角色的访问控制
3. **会话管理** - 多设备登录、强制下线
4. **安全增强** - 登录失败次数限制、IP白名单
5. **日志记录** - 登录日志、操作审计

---

*最后更新：2026-03-24*
