# 宝塔 Docker 部署说明

## 部署方式
本项目推荐在宝塔中以 Docker Compose 方式部署，统一拉起以下 4 个服务：

- `frontend`：React 生产构建 + Nginx 静态站点
- `backend`：FastAPI + Uvicorn
- `postgres`：PostgreSQL 16
- `redis`：Redis 7

## 服务器准备
在宝塔软件商店中安装：

- Docker 管理器
- Docker Compose

建议同时准备一个域名，例如：`resume.example.com`

## 上传项目
将项目上传到服务器，例如：

```bash
/www/wwwroot/ai-resume-analyze
```

## 配置环境变量
在项目根目录复制环境变量模板：

```bash
cp .env.example .env
```

然后重点修改以下字段：

- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `AI_API_URL`
- `AI_API_KEY`
- `ALLOWED_ORIGINS`
- `FRONTEND_PORT`
- `BACKEND_PORT`

说明：

- `ALLOWED_ORIGINS` 建议填写你的正式域名，例如 `https://resume.example.com`
- `VITE_API_BASE_URL` 保持 `/api` 即可，前端容器会自动反代后端

## 启动容器
在项目根目录执行：

```bash
docker compose up -d --build
```

查看状态：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

## 宝塔站点配置
推荐在宝塔中创建一个站点，然后把站点做反向代理到前端容器端口。

假设：

- 域名：`resume.example.com`
- 前端容器端口：`8080`

那么宝塔站点反向代理目标填：

```text
http://127.0.0.1:8080
```

这样外部访问流量会先进入宝塔 Nginx，再转到前端容器，前端容器内部会继续将 `/api/*` 请求转发给后端容器。

## 访问地址
启动成功后可访问：

- 前端首页：`http://服务器IP:8080`
- 接口文档：`http://服务器IP:8080/api/docs`

如果已经配置宝塔反代和域名，则访问：

- `https://resume.example.com`
- `https://resume.example.com/api/docs`

## 数据持久化
以下数据通过 Docker 卷自动持久化：

- PostgreSQL 数据：`postgres_data`
- Redis 数据：`redis_data`
- 简历原始 PDF：`resume_storage`

即使重建容器，上述数据仍会保留。

## 更新项目
代码更新后重新构建：

```bash
docker compose up -d --build
```

## 停止与清理
停止服务：

```bash
docker compose down
```

停止并删除容器、网络，但保留数据卷：

```bash
docker compose down
```

停止并删除容器、网络、数据卷：

```bash
docker compose down -v
```

注意：`-v` 会删除数据库、Redis 和简历 PDF 持久化数据。
