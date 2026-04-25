# 实施计划：AI 简历分析系统增强 v2

## 任务 1：补充后端领域测试
- 文件：
  - `backend/tests/test_resume_workbench.py`
- 测试点：
  - 候选人阶段分布与推荐分布聚合
  - Top 候选人排序
  - 批量对比摘要聚合
  - 历史筛选支持阶段与优先级
- 验证：
  - `python -m unittest discover -s tests -v`

## 任务 2：扩展后端 schema 与 resume 元信息
- 文件：
  - `backend/app/schemas/resume.py`
  - `backend/app/schemas/match.py`
  - `backend/app/schemas/dashboard.py`
  - `backend/app/services/resume_service.py`
- 实现：
  - 增加招聘阶段、优先级、标签、备注与最近匹配快照
  - 扩展 patch 更新能力
- 验证：
  - `python -m compileall app`

## 任务 3：扩展匹配与工作台服务
- 文件：
  - `backend/app/services/match_service.py`
  - `backend/app/services/dashboard_service.py`
- 实现：
  - 匹配历史增加风险与动作
  - 批量对比增加摘要字段
  - 仪表盘聚合阶段分布、推荐分布、Top 候选人与待办事项
- 验证：
  - `python -m unittest discover -s tests -v`

## 任务 4：补齐前端类型与请求层
- 文件：
  - `frontend/src/types/api.ts`
  - `frontend/src/utils/request.ts`
- 实现：
  - 对齐新增 dashboard / resume / compare / template 字段
  - 增加更新模板与更新简历管理信息的请求能力
- 验证：
  - `npm run build`

## 任务 5：升级首页、历史页、对比页、详情页
- 文件：
  - `frontend/src/pages/home-page.tsx`
  - `frontend/src/pages/history-page.tsx`
  - `frontend/src/pages/compare-page.tsx`
  - `frontend/src/pages/resume-detail-page.tsx`
  - `frontend/src/App.tsx`
- 实现：
  - 首页增加招聘流程、推荐候选人、待处理动作、模板编辑
  - 历史页增加阶段/优先级筛选
  - 对比页增加结果摘要
  - 详情页增加招聘管理信息编辑
- 验证：
  - `npm run build`

## 任务 6：补充文档与交付说明
- 文件：
  - `frontend/README.md`
  - `docs/`
- 实现：
  - 前端项目说明
  - 系统亮点/答辩说明
- 验证：
  - 文档内容与当前功能一致

## 任务 7：完整回归
- 验证命令：
  - `python -m unittest discover -s tests -v`
  - `python -m compileall app`
  - `npm run build`
