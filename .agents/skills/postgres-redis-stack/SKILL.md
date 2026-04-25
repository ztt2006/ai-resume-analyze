---
name: PostgreSQL + Redis 开发规范
description: SQLAlchemy2.0 建模、PG 数据表设计、Redis 缓存策略
---

## Rules
- 使用 SQLAlchemy 2.0 声明式模型，ORM 优先
- 业务表：resume 简历表、job_match 岗位匹配表
- 简历原文做 MD5 哈希，用于去重 & Redis Key
- Redis 缓存 AI 解析结果、匹配结果，过期时间 24h
- 所有时间字段统一 create_at TIMESTAMP 默认当前时间
- 敏感信息（手机号/邮箱）入库不加密但脱敏展示
- 先查缓存、再走AI/数据库，减少开销

## Workflow
1. 新建模型 -> 数据库迁移/自动建表
2. 新增数据前校验重复哈希
3. 计算完成后同步写入 PG + Redis

## Examples
```python
# Redis 缓存key规则
resume_cache_key = f"resume:md5:{resume_md5}"
match_cache_key = f"match:{resume_md5}:{jd_md5}"