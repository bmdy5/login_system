# 第 1 阶段（deps）：只安装依赖，利用 Docker 分层缓存加速后续构建。
# 说明：当 `package.json` / `package-lock.json` 没变化时，这一层通常可以直接复用，
# 避免每次都重新下载依赖。
FROM node:20-alpine AS deps

WORKDIR /app

# 仅复制依赖清单文件，最大化命中缓存。
COPY package*.json ./
# 基于 lock 文件进行确定性安装，保证依赖版本一致。
RUN npm ci

# 第 2 阶段（builder）：复制源码并执行 Next.js 构建。
# 这里会把代理目标作为构建参数注入环境变量，打包进最终产物中。
FROM node:20-alpine AS builder

WORKDIR /app

# 复用上一阶段已安装好的 node_modules，避免重复安装。
COPY --from=deps /app/node_modules ./node_modules
# 复制项目全部源码到构建容器。
COPY . .

# 认证/后端 API 代理目标（构建参数，可在 `docker build --build-arg` 覆盖）。
ARG API_PROXY_TARGET=http://backend:3001
# LLM 流式接口代理目标（构建参数，可在 `docker build --build-arg` 覆盖）。
ARG LLM_API_PROXY_TARGET=http://llm_api:8000
# 将构建参数转为环境变量，供 Next.js 构建过程读取。
ENV API_PROXY_TARGET=${API_PROXY_TARGET}
ENV LLM_API_PROXY_TARGET=${LLM_API_PROXY_TARGET}
# 显式声明生产环境构建。
ENV NODE_ENV=production

# 执行前端打包，产出 `.next` 目录内容。
RUN npm run build

# 第 3 阶段（runner）：仅保留运行时需要的最小文件，减小镜像体积。
# 不再包含源码与开发依赖，降低启动开销与攻击面。
FROM node:20-alpine AS runner

WORKDIR /app

# 运行环境变量：生产模式 + 应用监听端口。
ENV NODE_ENV=production
ENV PORT=3000

# 复制 `next build` 生成的独立运行文件与静态资源。
# `standalone` 内含 Node 服务入口（`server.js`）和最小依赖集合。
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 容器对外暴露 3000 端口。
EXPOSE 3000

# 启动 Next.js 独立服务器。
CMD ["node", "server.js"]
