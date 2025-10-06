# 环境变量配置完整指南

## 🚀 快速开始（本地开发）

我已经为您创建了 `.env.local` 文件，包含以下配置：

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="WGNcZoBw6+7+OgwrCdgqsUN+H1l0RLb8+AO7ZoWGMbE="
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

## 📋 环境变量说明

### 1. DATABASE_URL
- **开发环境**: `file:./dev.db` (SQLite数据库文件)
- **生产环境**: 需要替换为您的数据库连接字符串

### 2. NEXTAUTH_SECRET
- **作用**: 用于加密用户会话和令牌
- **当前值**: `WGNcZoBw6+7+OgwrCdgqsUN+H1l0RLb8+AO7ZoWGMbE=`
- **生产环境**: 建议生成新的密钥

### 3. NEXTAUTH_URL
- **开发环境**: `http://localhost:3000`
- **生产环境**: 您的域名，如 `https://your-app.vercel.app`

## 🏗️ 生产环境配置

### Vercel 部署
```bash
# 在 Vercel 控制台中设置环境变量
DATABASE_URL=your_postgresql_connection_string
NEXTAUTH_SECRET=your_new_secret_key
NEXTAUTH_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Railway 部署
```bash
# Railway 自动设置 PORT 和 DATABASE_URL
# 只需手动设置：
NEXTAUTH_SECRET=your_new_secret_key
NEXTAUTH_URL=https://your-app.railway.app
NODE_ENV=production
```

### Docker 部署
```bash
# 创建生产环境文件
cp .env.example .env

# 编辑 .env 文件
DATABASE_URL="postgresql://user:password@db:5432/taskmanager"
NEXTAUTH_SECRET="your_new_secret_key"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="production"
```

## 🔧 生成新的密钥

### 方法 1: 使用 OpenSSL
```bash
openssl rand -base64 32
```

### 方法 2: 使用 Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 方法 3: 使用在线工具
- 访问 https://generate-secret.vercel.app/32
- 复制生成的密钥

## 🗄️ 数据库配置选项

### SQLite (开发)
```bash
DATABASE_URL="file:./dev.db"
```

### PostgreSQL (推荐生产)
```bash
DATABASE_URL="postgresql://username:password@host:5432/database"
```

### MySQL
```bash
DATABASE_URL="mysql://username:password@host:3306/database"
```

## ✅ 验证配置

运行以下命令验证配置：

```bash
# 检查环境变量
npm run dev

# 初始化数据库
npm run db:push

# 运行健康检查
curl http://localhost:3000/api/health
```

## 🚨 安全注意事项

1. **永远不要提交 `.env` 文件到 Git**
2. **生产环境使用强密钥**
3. **定期轮换 NEXTAUTH_SECRET**
4. **使用 HTTPS 在生产环境**

## 📁 文件结构

```
project/
├── .env.local          # 本地开发配置（已创建）
├── .env.example        # 配置模板（已创建）
├── .env                # 生产环境配置（需要创建）
├── .gitignore          # 已包含 .env 文件
└── prisma/
    └── schema.prisma   # 数据库模式
```

## 🔄 下一步操作

1. **立即使用**: 当前配置可以直接运行 `npm run dev`
2. **部署前**: 生成新的 NEXTAUTH_SECRET
3. **生产部署**: 配置生产数据库 URL

现在您可以立即开始开发！🎉