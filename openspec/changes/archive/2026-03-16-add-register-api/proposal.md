## Why

当前项目虽然已有注册入口，但注册逻辑仍偏演示化，缺少一份面向“可复用接口能力”的明确规范：请求字段边界、重复用户名处理、返回结构、错误码、以及后续与前端联调的约定都不够清晰。现在补齐注册接口规范，可以让后续实现与测试有统一标准，减少“代码能跑但行为不一致”的问题。

## What Changes

- 规范并完善 `POST /api/auth/register` 的接口行为，明确输入、输出与错误处理规则。
- 明确注册成功后的返回数据结构，与登录接口保持风格一致（`success/message/data`）。
- 明确注册失败场景（缺字段、格式错误、用户名已存在）及对应状态码。
- 明确后端分层改动范围：`routes -> controller -> service -> repository -> db`。
- 明确与前端联调方式，保证前端可直接通过 `/api/auth/register` 发起请求并获得稳定结果。

## Capabilities

### New Capabilities
- `register-api`: 定义并交付可验证的用户注册接口能力，包括输入校验、冲突处理、成功返回与错误返回规范。

### Modified Capabilities
- （无）

## Impact

- Affected code:
  - `backend/src/routes/auth.js`
  - `backend/src/controllers/authController.js`
  - `backend/src/services/authService.js`
  - `backend/src/repositories/userRepository.js`
  - `backend/sql/init.sql`（如需字段/索引微调）
  - `frontend/src/lib/api.ts`（如需新增 register 调用封装）
  - `frontend/src/components/LoginForm.tsx`（如需接入注册入口）
- API:
  - `POST /api/auth/register`
- Tests:
  - 后端注册接口相关单测与边界场景

## Non-goals

- 本次不引入完整鉴权体系（JWT、Refresh Token、RBAC）。
- 本次不改造聊天链路与 llm_api 服务。
- 本次不进行大规模 UI 重构，仅关注注册接口可用性与一致性。
