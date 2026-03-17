## Context

当前仓库采用 `frontend + backend + llm_api` 的三服务结构。注册接口属于 backend 认证域，前端通过 Next.js rewrites 访问 `/api/auth/register`。现状下注册能力可用但规范不完整：输入边界、冲突响应、错误语义、与前端联调契约缺少统一约束。需要通过本次设计固定技术决策，避免实现阶段出现“接口可调用但行为不一致”。

## Goals / Non-Goals

**Goals:**
- 提供清晰、稳定、可测试的 `POST /api/auth/register` 接口规范。
- 明确后端分层职责：route/controller/service/repository。
- 保持响应结构与现有登录接口一致（`success/message/data`）。
- 为前端后续接入注册入口提供确定契约。

**Non-Goals:**
- 不改动 llm_api 聊天能力。
- 不引入完整 JWT 会话体系。
- 不做大规模前端 UI 重构。

## Decisions

1. 继续复用现有路由前缀：`/api/auth`。
- 方案A：新增独立 `/api/register`。
- 方案B（采用）：保留 `app.use('/api/auth', authRoutes)`，在 `authRoutes` 下维护 `POST /register`。
- 选择理由：与当前登录接口风格一致，前端更易理解与复用。

2. 统一响应契约。
- 采用 `sendSuccess/sendError` 工具返回统一 JSON。
- 避免 controller/service 各自返回不同结构。

3. 在 service 层集中做业务规则。
- controller 只负责参数转发与异常传递。
- service 负责用户名去空格、重复校验、错误语义。
- repository 仅负责 SQL 读写。

4. 配置读取策略保持不变。
- 数据库配置仍由 `backend/.env` + `backend/src/config/db.js` 管理。
- 不把业务规则写入环境变量，保持配置与业务分离。

## 登录主线

- `frontend/src/components/LoginForm.tsx`
- `frontend/src/lib/api.ts`
- `frontend/next.config.js`（`/api/:path*` -> backend）
- `backend/src/app.js`（`app.use('/api/auth', authRoutes)`）
- `backend/src/routes/auth.js`
- `backend/src/controllers/authController.js`
- `backend/src/services/authService.js`
- `backend/src/repositories/userRepository.js`

说明：本次注册接口增强保持该主线结构不变，只补齐 `/register` 的规范与行为一致性。

## 聊天主线

- `frontend/src/components/chat/ChatPanel.tsx`
- `frontend/src/lib/chatApi.ts`
- `frontend/next.config.js`（`/api/chat` -> llm_api）
- `llm_api/app/main.py`

说明：聊天主线本次不改动，仅作为系统上下文保留，避免变更扩散到 llm_api。

## Risks / Trade-offs

- [Risk] 注册规则变严格后，旧测试数据可能不满足新约束。  
  -> Mitigation: 在 tasks 中增加回归测试与错误场景验证。

- [Risk] 前端若暂未接入注册入口，可能误以为后端未生效。  
  -> Mitigation: 提供 curl 与接口返回示例做联调基线。

- [Risk] 若改动 SQL 字段/索引，可能影响现有初始化脚本。  
  -> Mitigation: 优先在不改表结构前提下完成接口能力。

## Migration Plan

1. 先更新/确认 `authService.register` 行为与错误语义。
2. 再对齐 `authController.register` 返回字段。
3. 执行注册接口测试（成功、重复、参数错误）。
4. 输出联调示例给前端。
5. 若异常，回滚到上一个 register 逻辑版本并保留日志。

## Open Questions

- 注册密码策略是否需要与登录策略完全一致（长度、字符集）？
- 是否在本次引入密码哈希（bcrypt）还是留到下一次安全改造？

留到下一次