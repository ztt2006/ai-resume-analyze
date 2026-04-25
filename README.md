# AI赋能智能简历分析系统

企业级招聘 AI 简历分析后台，支持 PDF 简历上传解析、AI 结构化提取、JD 匹配评分、批量对比、候选人阶段管理与招聘工作台分析。

## 核心能力
- PDF 简历上传、去重、全文解析、文本清洗
- AI 结构化提取姓名、电话、邮箱、地址、学历、项目经历等字段
- JD 关键词分析与智能匹配评分
- Redis 缓存解析结果与匹配结果
- PostgreSQL 持久化保存简历、匹配记录、模板数据
- 招聘管理能力：候选人阶段、优先级、标签、备注
- 批量对比与候选人排行榜
- 后台工作台：流程分布、推荐分布、Top 候选人、待处理动作

## 目录
- [backend/README.md](/E:/ai-resume-analyze/backend/README.md)
- [frontend/README.md](/E:/ai-resume-analyze/frontend/README.md)
- [docs/PROJECT_HIGHLIGHTS.md](/E:/ai-resume-analyze/docs/PROJECT_HIGHLIGHTS.md)

## 本地启动
### 后端
1. 进入 `backend`
2. 复制 `.env.example` 为 `.env`
3. 安装依赖：`python -m pip install -r requirements.txt`
4. 启动 PostgreSQL 与 Redis
5. 运行：`python main.py`

### 前端
1. 进入 `frontend`
2. 复制 `.env.example` 为 `.env`
3. 安装依赖：`npm install`
4. 启动：`npm run dev`

## Docker 部署
### 一键启动
1. 复制根目录环境变量模板：`cp .env.example .env`
2. 修改 `.env` 中的数据库密码、Redis 密码、AI 接口配置、域名白名单
3. 启动：`docker compose up -d --build`

### 默认端口
- 前端：`http://127.0.0.1:8080`
- 接口文档：`http://127.0.0.1:8080/api/docs`

### 宝塔部署
- 推荐在宝塔中将站点反向代理到 `http://127.0.0.1:8080`
- 详细步骤见 [docs/BAOTA_DOCKER_DEPLOY.md](/E:/ai-resume-analyze/docs/BAOTA_DOCKER_DEPLOY.md)

## 当前完成度
- 后端单测通过：`python -m unittest discover -s tests -v`
- 后端编译通过：`python -m compileall app`
- 前端打包通过：`npm run build`
