# AI 简历分析系统增强规格 v2

## 目标
将当前系统从“可用 MVP”提升为更完整的招聘管理后台，补齐招聘决策、候选人管理、模板运营、批量比较与答辩展示所需能力。

## 设计原则
- 保持现有 REST 接口风格、统一响应结构与分层架构不变。
- 优先增强真实业务能力，不做纯展示型堆砌。
- 不引入数据库迁移依赖，新增管理字段优先复用现有 `structured_data` JSON 持久化。
- 前端统一采用企业后台视图，弱化装饰性，强化管理效率。

## 范围

### 1. 招聘决策增强
- 为简历增加招聘管理元信息：
  - 候选人阶段 `stage`
  - 跟进优先级 `priority`
  - 人工标签 `tags`
  - 招聘备注 `notes`
- 匹配完成后自动生成候选人决策快照：
  - 最近匹配分
  - 最近推荐结论
  - 最近风险等级
  - 下一步动作
- 前端支持查看与编辑上述信息。

### 2. 工作台增强
- 扩展仪表盘接口，新增：
  - 候选人阶段分布
  - 推荐结论分布
  - Top 候选人榜单
  - 待处理动作列表
- 首页展示：
  - 核心统计卡
  - 招聘流程概览
  - 推荐候选人表
  - 待跟进任务卡

### 3. JD 与模板管理增强
- 模板不仅支持新增/删除，还支持编辑与回填。
- 首页模板区支持进入“编辑模板”模式。
- 匹配结果增加：
  - 推荐理由
  - 面试问题
  - JD 关键词命中情况

### 4. 批量对比增强
- 批量对比结果新增摘要信息：
  - Top 1 候选人
  - 平均分
  - 推荐通过人数
  - 高风险人数
- 前端对比页增加结果摘要与排序后的决策视图。

### 5. 历史与详情管理增强
- 历史页支持按阶段、优先级、关键词筛选。
- 简历详情页支持编辑招聘备注、标签、阶段、优先级。
- 详情页显示最近匹配中的推荐结论、风险、建议动作与面试问题。

### 6. 答辩交付增强
- 补齐前端 README。
- 根目录或 `docs/` 中补充系统亮点说明。
- 保持后端 README 与运行方式说明一致。

## 后端改动

### Schema 扩展
- `ResumeUploadData / ResumeHistoryItem / ResumeDetailData`
  - `stage`
  - `priority`
  - `tags`
  - `notes`
  - `latest_match_score`
  - `latest_recommendation`
  - `latest_risk_level`
  - `latest_next_action`
- `MatchHistoryItem`
  - `risk_level`
  - `next_action`
- `CompareMatchResponseData`
  - `average_score`
  - `recommended_count`
  - `high_risk_count`
  - `top_candidate_name`
- `DashboardOverview`
  - `stage_distribution`
  - `recommendation_distribution`
  - `top_candidates`
  - `pending_actions`

### 服务层扩展
- `resume_service`
  - 提取/更新招聘管理元信息
  - 列表与详情中返回最新匹配快照
- `match_service`
  - 历史记录补充风险与下一步动作
  - 批量对比补充摘要聚合
- `dashboard_service`
  - 聚合阶段分布、推荐分布、候选人榜单与待办动作

## 前端改动

### 首页
- 工作台统计卡
- 招聘流程概览
- Top 候选人表格
- 待处理动作面板
- 模板编辑能力
- 匹配结果补充推荐理由与面试问题

### 历史页
- 关键词 + 阶段 + 优先级筛选
- 更后台化表格展示

### 详情页
- 招聘管理信息表单
- 最近匹配记录增强展示

### 对比页
- 结果摘要卡
- 更适合答辩展示的排序结果

## 验证
- `python -m unittest discover -s tests -v`
- `python -m compileall app`
- `npm run build`
