## Overview

采用“用户动作主线 + 文件定位 + 可验证结果”的学习设计：
先理解整体架构，再按两条主链路（登录、聊天）逐步走读，最后通过复述与路径定位进行验收。

## Architecture

学习对象按三层组织：
- 接入层：前端组件与 API 封装（`frontend/src/components`、`frontend/src/lib`）
- 转发层：Next.js rewrites（`frontend/next.config.js`）
- 服务层：Express/FastAPI 路由、服务、数据访问（`backend/src`、`llm_api/app`）

## Data Flow

### 登录主线
1. `LoginForm.tsx` 提交
2. `api.ts` 请求 `/api/auth/login`
3. `next.config.js` 重写到 backend
4. `backend` 路由 -> controller -> service -> repository -> mysql
5. 响应返回前端，`router.push('/dashboard/chat')`

### 聊天主线
1. `ChatPanel.tsx` 提交消息
2. `chatApi.ts` 请求 `/api/chat`
3. `next.config.js` 重写到 llm_api
4. `llm_api/main.py` 调用 `litellm.acompletion(stream=True)`
5. `StreamingResponse` 持续返回文本，前端实时渲染

## Validation

- 能在 10 分钟内定位两条主链路的关键文件。
- 能解释 `response.json()`、`rewrite`、`pool`、`mysql2/promise` 的作用。
- 能口头复述“用户点击登录后，系统如何跳转并返回结果”。
