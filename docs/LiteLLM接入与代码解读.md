# LiteLLM 接入教程（本项目实战）

本文说明本项目里 `LiteLLM`（你说的 vitellm）是怎么工作的，包含关键代码路径、配置项、请求链路和排障方法。

## 1. 它在本项目中的角色

- 前端并不直接请求第三方模型接口。
- 前端统一请求 `POST /api/chat`。
- Next.js 将该请求转发到 `llm_api` 服务。
- `llm_api` 使用 `litellm.acompletion` 连接模型网关并流式返回文本。

## 2. 代码路径总览

- LLM 服务入口：`llm_api/app/main.py`
- LLM 配置读取：`llm_api/app/settings.py`
- 聊天请求结构：`llm_api/app/schemas.py`
- LLM 环境变量模板：`llm_api/.env.example`
- LiteLLM 依赖声明：`llm_api/pyproject.toml`
- 前端代理规则：`frontend/next.config.js`
- 前端流式读取：`frontend/src/lib/chatApi.ts`

## 3. 请求链路（从页面到模型）

1. 前端调用 `fetch('/api/chat')`  
   代码：`frontend/src/lib/chatApi.ts`（第 14 行）

2. Next.js 重写路由，把 `/api/chat` 代理到 `http://localhost:8000/api/chat`（默认）  
   代码：`frontend/next.config.js`（第 11-13 行）

3. FastAPI 接收请求并进入 `chat()`  
   代码：`llm_api/app/main.py`（第 95 行）

4. `chat()` 调用 `_stream_model_output()` 构造 LiteLLM 参数并请求上游模型  
   代码：`llm_api/app/main.py`（第 64-87 行）

5. `acompletion(..., stream=True)` 返回分块流；服务端提取每个 chunk 的文本并 `yield` 给前端  
   代码：`llm_api/app/main.py`（第 82-87 行）

6. 前端 `ReadableStream` 持续读取并拼接显示  
   代码：`frontend/src/lib/chatApi.ts`（第 38-56 行）

## 4. 配置是怎么注入到 LiteLLM 的

### 4.1 环境变量定义

`llm_api/.env`（可参考 `llm_api/.env.example`）:

```env
MODEL_NAME=default
LITELLM_PROVIDER=openai
LITELLM_API_BASE=https://dev-llm.tinypace.com
OPENAI_API_KEY=你的SecretKey
CORS_ALLOW_ORIGINS=http://localhost:3000
```

### 4.2 配置读取代码

`llm_api/app/settings.py`（第 22-28 行）：
- `MODEL_NAME` -> `settings.model_name`
- `LITELLM_API_BASE` -> `settings.api_base`
- `LITELLM_PROVIDER` -> `settings.llm_provider`
- `CORS_ALLOW_ORIGINS` -> `settings.cors_allow_origins`

### 4.3 传给 LiteLLM 的参数

`llm_api/app/main.py`（第 71-80 行）：

- `model`: 模型 ID（例如 `default`）
- `messages`: 对话消息数组
- `stream: True`: 开启流式输出
- `temperature`: 可选温度
- `api_base`: 你的网关地址（如 `https://dev-llm.tinypace.com`）
- `custom_llm_provider`: 提供商标识（本项目默认 `openai`）

## 5. 关键代码解释

### 5.1 启动和中间件

文件：`llm_api/app/main.py`

- 第 14 行 `load_dotenv()`：加载 `.env`。
- 第 16 行 `FastAPI(...)`：创建服务。
- 第 19-25 行 CORS：允许前端跨域访问。

### 5.2 请求体校验

文件：`llm_api/app/schemas.py`

- `ChatRequest.messages` 最少 1 条（第 14 行）。
- `temperature` 范围 `0~2`（第 15 行）。
- 消息角色限定为 `system/user/assistant`（第 9 行）。

### 5.3 流式解析

文件：`llm_api/app/main.py`

- `_extract_text_from_chunk()`（第 28-61 行）兼容不同 chunk 结构（dict 或对象）。
- `chat()`（第 95-110 行）返回 `StreamingResponse`，媒体类型 `text/plain`。

### 5.4 依赖声明

文件：`llm_api/pyproject.toml`

- 第 9 行：`litellm>=1.51.0`
- 第 7-8 行：FastAPI 和 Uvicorn

## 6. 启动与验证

### 6.1 启动 llm_api

```bash
cd llm_api
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

### 6.2 健康检查

```bash
curl http://127.0.0.1:8000/health
```

期望：

```json
{"success":true,"message":"ok"}
```

### 6.3 流式对话测试

```bash
curl -N -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好"}]}'
```

## 7. 常见问题

### 7.1 访问 `http://localhost:8000/` 返回 Not Found

这是正常的。根路径 `/` 没有定义。  
请用：
- `GET /health`
- `POST /api/chat`

### 7.2 `MODEL_NAME is not configured`

`llm_api/.env` 缺少 `MODEL_NAME`，或服务未重启加载新环境变量。

### 7.3 `Address already in use`（8000 端口占用）

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
kill <PID>
```

## 8. 安全提醒

- `OPENAI_API_KEY` 不要提交到 Git。
- Key 泄露后应立即重置并替换。
- 生产环境建议按环境隔离不同 key，避免开发 key 直接进生产。
