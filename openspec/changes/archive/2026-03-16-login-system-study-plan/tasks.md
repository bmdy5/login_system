## Tasks

- [ ] 1. 建立项目全局认知
  - [ ] 1.1 阅读目录与服务关系图（frontend/backend/llm_api/docker）
  - [ ] 1.2 明确两条主线：登录链路与聊天链路

- [ ] 2. 完成登录链路走读
  - [ ] 2.1 从 `frontend/src/components/LoginForm.tsx` 开始
  - [ ] 2.2 跟到 `frontend/src/lib/api.ts` 与 `frontend/next.config.js`
  - [ ] 2.3 跟到 `backend/src/app.js` -> `backend/src/routes/auth.js`
  - [ ] 2.4 跟到 `authController.js` -> `authService.js` -> `userRepository.js` -> `config/db.js`

- [ ] 3. 完成聊天链路走读
  - [ ] 3.1 从 `frontend/src/components/chat/ChatPanel.tsx` 开始
  - [ ] 3.2 跟到 `frontend/src/lib/chatApi.ts` 与 `frontend/next.config.js`
  - [ ] 3.3 跟到 `llm_api/app/main.py` 与 `llm_api/app/settings.py`

- [ ] 4. 完成概念与验收
  - [ ] 4.1 能解释 `response.json()` 与 `rewrite` 的区别
  - [ ] 4.2 能解释 `pool` 与 `mysql2/promise` 的作用
  - [ ] 4.3 能独立复述两条主线的端到端流程
