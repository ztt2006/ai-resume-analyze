# AI赋能智能简历分析系统后端

## 技术栈
- Python 3.11+
- FastAPI
- SQLAlchemy 2.0
- PostgreSQL
- Redis
- pdfplumber

## 目录结构
```text
backend/
├─ app/
│  ├─ api/routes      # 路由层
│  ├─ core            # 配置、异常、统一响应
│  ├─ db              # 数据库基座与会话
│  ├─ models          # ORM 模型
│  ├─ schemas         # 请求与响应模型
│  ├─ services        # 业务服务
│  └─ utils           # PDF/文本/哈希等工具
├─ tests              # 单元测试
├─ .env.example
├─ main.py
└─ requirements.txt
```

## 启动步骤
1. 复制环境变量：
   `copy .env.example .env`
2. 安装依赖：
   `python -m pip install -r requirements.txt`
3. 启动 PostgreSQL 与 Redis。
4. 启动服务：
   `python main.py`

## 说明
- `POST /api/resumes/upload`：上传 PDF 并自动解析。
- `POST /api/matches`：提交 `resume_id + jd_text` 生成匹配评分。
- `GET /api/history`：查看简历与匹配历史。
- `PATCH /api/resumes/{resume_id}`：更新文件名、招聘阶段、优先级、标签和备注。
- `POST /api/matches/compare`：同一 JD 下批量对比候选人并生成摘要。
- `GET /api/dashboard/overview`：获取工作台统计、流程分布、Top 候选人与待处理动作。
- 未配置大模型 HTTP 参数时，系统会自动启用本地规则回退，确保开发环境可直接跑通。
- `handler = app` 已保留，方便阿里云函数计算等 ASGI 方式接入。
