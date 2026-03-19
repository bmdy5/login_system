# Login System

登录系统（Dashboard + 大模型流式对话）：
- 前端：Next.js 14 + TypeScript
- 登录后端：Node.js + Express + MySQL
- 大模型后端：FastAPI + LiteLLM

## 1. 项目结构

```text
login_system/
  frontend/      # 前端（登录页 + Dashboard + 对话页）
  backend/       # 登录后端（用户注册/登录）
  llm_api/       # 大模型后端（流式对话）
  docs/          # 项目文档
  docker/        # Docker/环境配置文件
```

## 2. 教程文档

- LiteLLM 接入与代码解读：`docs/LiteLLM接入与代码解读.md`
- 流式输出问题与解决：`docs/大模型流式输出问题与解决.md`
- AI 生成项目审核官教程：`docs/AI生成项目审核官教程.md`
- Git 与 Docker 实操笔记：`docs/Git与Docker实操笔记（login_system）.md`

## 3. 环境准备

- Node.js 18+
- Python 3.12+
- uv
- MySQL 8+
- Docker Desktop（可选，用于一键容器启动）

## 4. 本地开发（分服务启动）

### 4.1 初始化数据库

```bash
cd /Users/xiaofeng/Documents/实习任务/login_system
mysql -u root -p < backend/sql/init.sql
```

### 4.2 配置环境变量

1) 登录后端 `backend/.env`

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=login_system
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_TIMEZONE=+08:00
```

2) 大模型后端 `llm_api/.env`

```env
MODEL_NAME=default
LITELLM_PROVIDER=openai
LITELLM_API_BASE=https://dev-llm.tinypace.com
OPENAI_API_KEY=你的Secret Key
CORS_ALLOW_ORIGINS=http://localhost:3000
```

3) 前端 `frontend/.env.local`

```env
API_PROXY_TARGET=http://localhost:3001
LLM_API_PROXY_TARGET=http://localhost:8000
```

### 4.3 启动服务

1) 启动后端（3001）

```bash
cd backend
npm install
npm run dev
```

2) 启动大模型后端（8000）

```bash
cd llm_api
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

3) 启动前端（3000）

```bash
cd frontend
npm install
npm run dev
```

前端代理规则：
- `/api/chat` -> `LLM_API_PROXY_TARGET`（默认 `http://localhost:8000`）
- 其他 `/api/*` -> `API_PROXY_TARGET`（默认 `http://localhost:3001`）

## 5. Docker 本地一键启动

### 5.1 启动 Docker Desktop

macOS:

```bash
open -a Docker
```

检查 daemon：

```bash
docker info
```

### 5.2 准备并启动

```bash
cd /Users/xiaofeng/Documents/实习任务/login_system
docker compose \
  -f docker/docker-compose.yml \
  --env-file docker/.env.docker \
  up -d --build
```

启动后：
- 前端：`http://localhost:3000`
- 登录后端：`http://localhost:3001`
- 大模型后端：`http://localhost:8000`
- MySQL：`localhost:3306`

常用命令：

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env.docker ps
docker compose -f docker/docker-compose.yml --env-file docker/.env.docker logs -f
docker compose -f docker/docker-compose.yml --env-file docker/.env.docker down
docker compose -f docker/docker-compose.yml --env-file docker/.env.docker down -v
```

## 6. 常见问题排查

### 6.1 后端启动后崩溃（数据库认证失败）

现象：

```text
Failed to connect database: Access denied for user 'root'@'localhost'
```

原因：
- `backend/.env` 中 `DB_PASSWORD` 仍是占位值（如 `your_password`）。

处理：
- 改成真实 MySQL 密码后重启 `backend`。

### 6.2 大模型后端无法启动（`[Errno 48] Address already in use`）

原因：
- 8000 端口已被旧 `uvicorn` 进程占用。

处理：

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
kill <PID>
uv run uvicorn app.main:app --reload --port 8000
```

### 6.3 Docker 报错 `Cannot connect to the Docker daemon`

原因：
- Docker daemon 未启动。

处理：

```bash
open -a Docker
unset DOCKER_HOST
docker info
```

## 7. 生产部署（Docker）

### 7.1 构建并推送镜像（本机执行）

```bash
docker login

docker build -t <仓库>/login-system-backend:1.0.0 ./backend
docker build -t <仓库>/login-system-llm-api:1.0.0 ./llm_api
docker build \
  --build-arg API_PROXY_TARGET=http://backend:3001 \
  --build-arg LLM_API_PROXY_TARGET=http://llm_api:8000 \
  -t <仓库>/login-system-frontend:1.0.0 ./frontend

docker push <仓库>/login-system-backend:1.0.0
docker push <仓库>/login-system-llm-api:1.0.0
docker push <仓库>/login-system-frontend:1.0.0
```

### 7.2 服务器启动

上传到同一目录（例如 `/opt/login-system`）：
- `docker/docker-compose.prod.yml`（可重命名为 `docker-compose.prod.yml`）
- `docker/.env.prod`（可重命名为 `.env.prod`）
- `backend/sql/init.sql`

```bash
cd /opt/login-system
docker login
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod pull
docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod up -d
```

## 8. 接口快速验证

1) 注册

`POST /api/auth/register`

```json
{
  "username": "alice",
  "password": "123456"
}
```

2) 登录

`POST /api/auth/login`

```json
{
  "username": "alice",
  "password": "123456"
}
```

3) 大模型流式对话

`POST /api/chat`

```bash
curl -N -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好"}]}'
```
