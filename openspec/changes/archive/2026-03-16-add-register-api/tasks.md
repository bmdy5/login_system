## 1. 路由与接口入口对齐

- [x] 1.1 确认 `backend/src/app.js` 中 `app.use('/api/auth', authRoutes)` 正常挂载
- [x] 1.2 在 `backend/src/routes/auth.js` 确认并对齐 `router.post('/register', authController.register)`
- [ ] 1.3 验证动作：启动 backend 后用 `curl -i -X POST /api/auth/register` 确认能命中路由（非 404）

## 2. Service 层注册规则实现

- [x] 2.1 在 `backend/src/services/authService.js` 对齐注册输入校验（用户名、密码、类型与最小约束）
- [x] 2.2 实现重复用户名检测与冲突错误返回语义（409）
- [x] 2.3 保持注册成功后返回可展示的用户公共字段
- [ ] 2.4 验证动作：分别用“正常输入/重复用户名/空字段”请求，确认返回状态码与 message 符合 spec

## 3. Repository 与数据库写入对齐

- [x] 3.1 在 `backend/src/repositories/userRepository.js` 对齐 `createUser`、`findByUsername`、`findPublicUserById`
- [x] 3.2 对齐审计写入逻辑 `createAuditLog`（注册成功/失败可追踪）
- [x] 3.3 如有必要检查 `backend/sql/init.sql` 字段与索引是否支持当前注册行为
- [ ] 3.4 验证动作：注册后在数据库中确认 `users` 与 `login_audit` 数据正确落库

## 4. Controller 返回契约与错误路径

- [x] 4.1 在 `backend/src/controllers/authController.js` 保持 `sendSuccess/sendError` 返回结构一致
- [x] 4.2 确认异常通过 `next(error)` 进入全局错误处理中间件
- [ ] 4.3 验证动作：触发业务错误并检查返回 JSON 结构为 `{ success, message }` 或 `{ success, message, data }`

## 5. 前端接入与联调（可选）

- [x] 5.1 在 `frontend/src/lib/api.ts` 增加 `register` 请求封装（如本次需要前端注册入口）
- [x] 5.2 在前端页面接入注册按钮或注册流程（如本次范围包含 UI）
- [ ] 5.3 验证动作：浏览器端发起注册请求并确认能完成端到端注册

## 6. 测试与回归

- [x] 6.1 补充或更新后端注册相关测试（成功、重复、参数错误）
- [x] 6.2 回归登录接口，确认新增注册改动未破坏现有登录流程
- [ ] 6.3 验证动作：执行测试命令并记录结果；手工回归 `/api/auth/login` 与 `/api/auth/register`

> 当前阻塞说明：在本执行环境中，端口监听与本地 DB/HTTP 联调会触发 `EPERM`（例如 `listen` / `connect 127.0.0.1:3306`），因此 1.3、2.4、3.4、4.3、5.3、6.3 需在你的本机终端继续完成。
