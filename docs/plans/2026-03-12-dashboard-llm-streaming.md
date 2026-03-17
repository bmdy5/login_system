# 登录后跳转 + 大模型流式对话 实施计划

> **给 Claude：** 必须使用 `superpowers:executing-plans` 按任务逐步执行本计划。

**目标：** 在现有登录系统上实现登录后跳转到 Dashboard，提供左侧菜单栏和“大模型对话”入口，并通过 FastAPI + LiteLLM 向前端实时流式输出模型回复。

**架构：** 当前仓库实际是 `Next.js App Router + Node/Express + MySQL`，不是 `Vite + React Router + FastAPI 单后端`。为了最小改动、最快落地：保留现有 Node 登录服务，新增独立 `llm_api(FastAPI)` 服务处理 `/api/chat`；前端继续使用 Next.js 路由和布局，通过 `rewrites` 将聊天请求代理到 FastAPI。

**技术栈：** Next.js 14 + TypeScript、Node.js/Express、Python FastAPI、LiteLLM、Docker Compose。

---

## 一、范围对齐（先统一认知）

- 不安装 `react-router-dom`：当前前端是 Next.js，路由应使用 `app/` 目录体系。
- 不替换现有 Node 后端：登录与用户数据逻辑保持原样。
- 新增 Python 服务专门做大模型流式接口。
- 保持前端 TypeScript 严格类型；FastAPI 接口使用 `async def`。
- 保留你要求的两次核心提交：
1. `feat(ui): add dashboard layout and navigation`
2. `feat(api): integrate litellm with streaming response`

## 二、任务拆分

### 任务 1：登录后跳转 + Dashboard 布局（前端）

**涉及文件：**
- 新建：`frontend/src/app/dashboard/layout.tsx`
- 新建：`frontend/src/app/dashboard/page.tsx`
- 新建：`frontend/src/app/dashboard/chat/page.tsx`
- 新建：`frontend/src/components/layout/Sidebar.tsx`
- 修改：`frontend/src/components/LoginForm.tsx`
- 修改：`frontend/src/app/globals.css`

**步骤 1：先确认失败基线（当前行为）**
- 当前登录成功后只在同页显示“登录成功”，不会跳转 Dashboard。

**步骤 2：本地验证失败基线**

```bash
cd frontend
npm run dev
```

期望（当前）：登录成功后仍停留 `/`。

**步骤 3：最小实现**
- `LoginForm.tsx`：
  - 登录成功后保存最小用户信息（可先用 `sessionStorage`）。
  - 使用 `useRouter().push('/dashboard/chat')` 跳转。
- `dashboard/layout.tsx`：
  - 左侧固定菜单栏（含“大模型对话”菜单）。
  - 右侧内容区渲染 `children`。
- `dashboard/page.tsx`：
  - 自动跳转到 `/dashboard/chat`。
- `dashboard/chat/page.tsx`：
  - 先放置对话组件占位（下一任务接入流式）。

**步骤 4：验证通过**

```bash
cd frontend
npm run dev
```

期望：登录后自动跳转 `/dashboard/chat`，左侧菜单可见。

**步骤 5：提交**

```bash
git add frontend/src/app/dashboard frontend/src/components/layout/Sidebar.tsx frontend/src/components/LoginForm.tsx frontend/src/app/globals.css
git commit -m "feat(ui): add dashboard layout and navigation"
```

### 任务 2：新增 FastAPI + LiteLLM 流式接口（后端）

**涉及文件：**
- 新建：`llm_api/pyproject.toml`
- 新建：`llm_api/app/main.py`
- 新建：`llm_api/app/schemas.py`
- 新建：`llm_api/app/settings.py`
- 新建：`llm_api/.env.example`
- 新建：`llm_api/tests/test_chat_stream.py`
- 修改：`docker-compose.yml`
- 修改：`docker-compose.prod.yml`

**步骤 1：先写失败用例**
- `POST /api/chat` 应返回流式响应（`StreamingResponse`）。
- 模拟 LiteLLM 分片输出，断言前端可逐步接收。
- 缺少 `MODEL_NAME` 时返回清晰错误。

**步骤 2：运行测试确认失败**

```bash
cd llm_api
uv run pytest -q
```

期望：接口未实现，测试失败。

**步骤 3：最小实现**
- `pyproject.toml` 增加依赖：
  - `fastapi` `uvicorn` `litellm` `python-dotenv`
  - 测试依赖 `pytest` `httpx`
- `settings.py` 从环境变量读取：
  - `MODEL_NAME`
  - provider key（如 `OPENAI_API_KEY`）
  - `CORS_ALLOW_ORIGINS`
- `schemas.py` 定义严格类型：
  - `ChatMessage(role, content)`
  - `ChatRequest(messages, temperature?)`
- `main.py`：
  - 实现 `async def /api/chat`
  - 调用 LiteLLM（`stream=True`）并逐块 `yield`
  - 返回 `StreamingResponse`
  - 增加 CORS（至少允许 `http://localhost:3000`）
  - 增加 `/health`

**步骤 4：验证通过**

```bash
cd llm_api
uv run pytest -q
uv run uvicorn app.main:app --reload --port 8000
curl -N -X POST http://localhost:8000/api/chat -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"你好"}]}'
```

期望：测试通过；`curl -N` 持续收到文本分片。

**步骤 5：提交**

```bash
git add llm_api docker-compose.yml docker-compose.prod.yml
git commit -m "feat(api): integrate litellm with streaming response"
```

### 任务 3：前端接入流式对话（Next.js 页面）

**涉及文件：**
- 新建：`frontend/src/types/chat.ts`
- 新建：`frontend/src/lib/chatApi.ts`
- 新建：`frontend/src/components/chat/ChatPanel.tsx`
- 修改：`frontend/src/app/dashboard/chat/page.tsx`
- 修改：`frontend/next.config.js`

**步骤 1：先确认失败基线**
- 当前聊天页没有真实流式读取能力。

**步骤 2：运行确认**

```bash
cd frontend
npm run dev
```

期望（当前）：无法逐字/逐段看到模型回复。

**步骤 3：最小实现**
- `chat.ts`：定义消息类型与请求类型。
- `chatApi.ts`：
  - 使用 `fetch + ReadableStream + TextDecoder`
  - 暴露 `streamChat({messages}, {onChunk, signal})`
- `ChatPanel.tsx`：
  - 消息列表、输入框、发送按钮
  - 创建 assistant 占位消息并实时拼接 chunk
  - 支持发送中状态、取消请求、异常提示
- `next.config.js`：
  - 新增 `LLM_API_PROXY_TARGET`（默认 `http://localhost:8000`）
  - `rewrites` 优先代理 `/api/chat` 到 FastAPI
  - 其余 `/api/*` 继续到 Node backend

**步骤 4：端到端验证**

```bash
docker compose --env-file .env.docker up -d --build
```

期望：登录后进入 Dashboard；点击“大模型对话”后可实时看到模型流式输出。

**步骤 5：提交（可选增强提交）**

```bash
git add frontend/src/types/chat.ts frontend/src/lib/chatApi.ts frontend/src/components/chat/ChatPanel.tsx frontend/src/app/dashboard/chat/page.tsx frontend/next.config.js
git commit -m "feat(ui): wire streaming chat panel to fastapi endpoint"
```

### 任务 4：文档与联调收尾

**涉及文件：**
- 修改：`README.md`
- 修改：`.env.docker.example`
- 修改：`.env.prod.example`

**步骤 1：先列失败清单**
- 文档尚无 FastAPI/LiteLLM 启动说明与环境变量示例。

**步骤 2：运行验证**

```bash
docker compose --env-file .env.docker up -d --build
```

期望（当前）：文档不足以让他人独立复现。

**步骤 3：补齐文档**
- 增加 `llm_api` 启动方式（本地与 Docker）。
- 增加必要环境变量说明：
  - `MODEL_NAME`
  - provider key
  - `LLM_API_PROXY_TARGET`
- 增加最小联调命令和常见报错定位。

**步骤 4：回归验证**

```bash
curl -sS http://localhost:3001/api/health
curl -sS http://localhost:8000/health
```

期望：Node 与 FastAPI 健康；按 README 可完整跑通。

**步骤 5：提交**

```bash
git add README.md .env.docker.example .env.prod.example
git commit -m "docs: add llm streaming setup and runbook"
```

## 三、风险与应对

- **风险 1：LiteLLM 配置复杂**  
先固定一个 provider 打通（例如 OpenAI 兼容接口），后续再扩展多模型。

- **风险 2：流式协议兼容问题**  
先用纯文本 chunk 流，稳定后再升级 SSE 事件格式。

- **风险 3：登录态仅前端保存**  
本次先满足“登录后跳转 + 页面可用”；后续可加 JWT/Session 与路由守卫。

