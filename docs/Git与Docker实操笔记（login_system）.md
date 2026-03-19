# git和docker代码管理笔记（小白版）

https://github.com/bmdy5/login_system  
这个是本文里推送的项目。

我用的是 VS Code。  
这篇就是按我自己从 0 开始操作的顺序写的，哪里报错了我就怎么处理，不讲太多概念，直接上能跑通的步骤。

## 截图保留说明（CSDN）

下面正文里我已经把截图都放在对应步骤，直接用 GitHub Raw 链接。  
只要把图片放到仓库 `docs/assets/git-docker/` 对应文件名并 push，CSDN 就能直接显示。

对应关系：

- `01-vscode提交卡住.png`：VS Code 提交卡住（变更 10000）
- `02-https推送ssl报错.png`：HTTPS 推送失败（SSL handshake failure）
- `03-github添加ssh密钥.png`：GitHub 添加 SSH 密钥页面
- `04-ssh推送成功.png`：SSH 推送成功终端截图
- `05-docker容器列表.png`：Docker 容器列表截图

## 一、从 0 开始把本地项目推到 GitHub

刚开始打开项目时，仓库不会自动创建，需要先在项目根目录执行 `git init`。

```bash
cd /Users/xiaofeng/Documents/实习任务/login_system
git init
```

看到有 `.git` 目录，说明仓库创建成功。

然后我执行下面这套：

```bash
git add .
git commit -m "init: login_system"
git branch -M main
git remote add origin https://github.com/bmdy5/login_system.git
git push -u origin main
```

这里补一句我当时的理解：  
`git add` = 提交到暂存区，不是已经上传到 GitHub。

## 二、如果提交时报“没绑定远程仓库”

这种情况很常见，先配 Git 账号信息：

```bash
git config --global user.name "bmdy5"
git config --global user.email "xiaoliang7765@163.com"
```

配置完验证一下：

```bash
git config --global --get user.name
git config --global --get user.email
```

然后再回到 VS Code 里提交/推送就行。

## 三、我遇到的坑：点击提交卡住，文件太多

我当时在 VS Code 里点提交，卡住了。  
核心原因就是：不该提交的东西太多（依赖、缓存、环境变量）也被加进去了。

![VS Code提交卡住，变更数量太多](https://raw.githubusercontent.com/bmdy5/login_system/main/docs/assets/git-docker/01-vscode提交卡住.png)

这里一定要先把 `.gitignore` 处理好。

我自己用的是这份：

```bash
cd /Users/xiaofeng/Documents/实习任务/login_system

cat > .gitignore << 'EOF'
# Secrets / env
**/.env
**/.env.*
**/*.env
**/*.env.*

# Keep env templates
!**/.env.example
!**/.env.*.example
!**/*.env.example
!**/*.env.*.example

# Node / Next
**/node_modules/
frontend/.next/
frontend/out/

# Python
llm_api/.venv/
**/__pycache__/
**/.pytest_cache/

# IDE / OS / local tools
.idea/
.vscode/
.DS_Store
.claude/
.codex/

# Logs
*.log
EOF
```

如果之前已经 `git add` 过，先把暂存清掉，再重新加：

```bash
git restore --staged .
git add .
git commit -m "init: login_system with gitignore"
git branch -M main
```

远程仓库没绑就用：

```bash
git remote add origin https://github.com/bmdy5/login_system.git
```

如果提示 `origin already exists`，改用：

```bash
git remote set-url origin https://github.com/bmdy5/login_system.git
```

最后推送：

```bash
git push -u origin main
```

## 四、HTTPS 推送失败，我改成 SSH 推送

我当时推送失败，后面切 SSH 解决了。

![HTTPS推送失败，出现SSL握手错误](https://raw.githubusercontent.com/bmdy5/login_system/main/docs/assets/git-docker/02-https推送ssl报错.png)

```bash
# 1) 生成 SSH key（已存在可跳过）
ssh-keygen -t ed25519 -C "你的GitHub邮箱"

# 2) 复制公钥
cat ~/.ssh/id_ed25519.pub
```

然后去 GitHub 的 `Settings -> SSH and GPG keys` 添加公钥。

![GitHub添加SSH公钥页面](https://raw.githubusercontent.com/bmdy5/login_system/main/docs/assets/git-docker/03-github添加ssh密钥.png)

再测试：

```bash
ssh -T git@github.com
```

把远程地址改成 SSH：

```bash
git remote set-url origin git@github.com:bmdy5/login_system.git
```

再推一次：

```bash
git push -u origin main
```

![SSH方式推送成功](https://raw.githubusercontent.com/bmdy5/login_system/main/docs/assets/git-docker/04-ssh推送成功.png)

## 五、如果报 `Repository not found`

这个我也遇到了。  
说明你还没在 GitHub 上创建对应仓库（比如 `login_system`）。

先去 GitHub 把仓库建好，再执行：

```bash
git push -u origin main
```

## 六、同事 clone 之后要做什么

同事拉代码：

```bash
git clone https://github.com/bmdy5/login_system.git
```

拉完第一件事不是直接启动，是先配环境变量。  
我这里只提交了模板，真实值要手动填。

先复制这几个：

```bash
cp backend/.env.example backend/.env
cp llm_api/.env.example llm_api/.env
cp frontend/.env.local.example frontend/.env.local
cp docker/.env.docker.example docker/.env.docker
cp docker/.env.prod.example docker/.env.prod
```

然后再启动：

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env.docker up -d --build
docker compose -f docker/docker-compose.yml --env-file docker/.env.docker ps
```

## 七、Docker 笔记（这个项目）

![Docker中查看项目容器运行情况](https://raw.githubusercontent.com/bmdy5/login_system/main/docs/assets/git-docker/05-docker容器列表.png)

1. 进入项目目录

```bash
cd "/Users/xiaofeng/Documents/实习任务/测试git和docker/login_system测试git和docker版"
```

2. 首次准备环境变量（只做一次）

```bash
cp docker/.env.docker.example docker/.env.docker
```

3. 启动（构建并后台运行）

```bash
docker compose -f docker/docker-compose.clone.yml --env-file docker/.env.docker up -d --build
```

4. 查看运行状态

```bash
docker compose -f docker/docker-compose.clone.yml --env-file docker/.env.docker ps
```

5. 查看日志（实时）

```bash
docker compose -f docker/docker-compose.clone.yml --env-file docker/.env.docker logs -f
```

6. 重启某个服务（例：frontend）

```bash
docker compose -f docker/docker-compose.clone.yml --env-file docker/.env.docker restart frontend
```

7. 停止并删除当前这套容器

```bash
docker compose -f docker/docker-compose.clone.yml --env-file docker/.env.docker down
```

8. 停止并连数据卷一起删（谨慎）

```bash
docker compose -f docker/docker-compose.clone.yml --env-file docker/.env.docker down -v
```

9. 查看全部容器（跨项目）

```bash
docker ps
docker ps -a
```

10. 我这套端口

- 前端：`http://localhost:3013`
- backend：`http://localhost:3012`
- llm_api：`http://localhost:8011`
- mysql：`3317`

## 八、我自己的一句总结

`Git/.gitignore` 负责“哪些文件要进版本库”。  
`Docker Compose` 负责“项目怎么跑起来”。  

实际流程就是：

1. Git 拉代码。
2. 配 `.env`（从 `.example` 复制）。
3. Docker 启动服务。

---

原始草稿在语雀：  
https://www.yuque.com/danqu-o6wxd/sb5log/nuyo2i16pu7ugt1i
