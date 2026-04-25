---
name: FastAPI 2.0 工程规范
description: 统一 FastAPI 分层、响应、异常、依赖、REST 接口规范
---

## Rules
- 采用分层结构：routes 路由 / services 业务 / models 模型 / schemas 入参出参 / utils 工具
- 数据库、Redis 使用依赖注入统一管理
- 全局统一返回体：{"code":int,"data":any,"message":str}
- 必须全局异常捕获，不直接抛出原生错误
- 使用 python-dotenv 管理环境变量，禁止硬编码密钥
- 文件上传使用 python-multipart，严格校验文件类型
- 适配阿里云 Serverless 函数计算部署

## Workflow
1. 路由只做参数接收与校验，业务逻辑下沉到 service
2. 数据库操作统一使用 SQLAlchemy 2.0 会话
3. 接口遵循 RESTful 命名风格

## Examples
```python
from fastapi import APIRouter, Depends
router = APIRouter(prefix="/api/resume")