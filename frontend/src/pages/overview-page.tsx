import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import type {
  DashboardOverview,
  HistoryPayload,
  MatchResponseData,
  ResumeUploadData,
} from "@/types/api"

type OverviewPageProps = {
  activeResume: ResumeUploadData | null
  activeMatch: MatchResponseData | null
  dashboard: DashboardOverview | null
  history: HistoryPayload
  errorMessage: string | null
}

const stageLabelMap: Record<string, string> = {
  new: "新入库",
  screening: "筛选中",
  interview: "面试中",
  offer: "待发 Offer",
  rejected: "已淘汰",
}

const priorityLabelMap: Record<string, string> = {
  low: "低优先级",
  medium: "中优先级",
  high: "高优先级",
}

export function OverviewPage({
  activeResume,
  activeMatch,
  dashboard,
  history,
  errorMessage,
}: OverviewPageProps) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>简历总数</CardDescription>
            <CardTitle className="text-2xl text-[#1d2129]">
              {dashboard?.total_resumes ?? history.resumes.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>匹配总数</CardDescription>
            <CardTitle className="text-2xl text-[#1d2129]">
              {dashboard?.total_matches ?? history.matches.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>平均匹配分</CardDescription>
            <CardTitle className="text-2xl text-[#1d2129]">{dashboard?.average_score ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>最高匹配分</CardDescription>
            <CardTitle className="text-2xl text-[#1d2129]">{dashboard?.highest_score ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {errorMessage ? (
        <Card className="border-destructive/20 shadow-none">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader>
            <CardTitle className="text-lg text-[#1d2129]">候选人优先榜</CardTitle>
            <CardDescription>基于最近一次匹配结果输出推荐候选人</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {dashboard?.top_candidates.length ? (
              dashboard.top_candidates.map((candidate, index) => (
                <div
                  key={candidate.resume_id}
                  className="grid gap-3 rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4 md:grid-cols-[64px_minmax(0,1fr)_120px]"
                >
                  <div className="flex items-center justify-center rounded-md bg-white text-lg font-semibold text-[#1d2129]">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#1d2129]">
                      {candidate.candidate_name || candidate.filename}
                    </p>
                    <p className="mt-1 text-sm text-[#4e5969]">{candidate.filename}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">{stageLabelMap[candidate.stage]}</Badge>
                      <Badge variant="outline">{priorityLabelMap[candidate.priority]}</Badge>
                      {candidate.latest_recommendation ? (
                        <Badge variant="secondary">{candidate.latest_recommendation}</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xs text-[#86909c]">最近得分</p>
                    <p className="mt-1 text-2xl font-semibold text-[#1d2129]">
                      {candidate.latest_score}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[#d9dde4] bg-[#fafbfc] p-6 text-sm text-[#86909c]">
                还没有候选人榜单数据
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="border-[#e5e6eb] shadow-none">
            <CardHeader>
              <CardTitle className="text-lg text-[#1d2129]">招聘流程概览</CardTitle>
              <CardDescription>查看候选人阶段分布</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {Object.entries(dashboard?.stage_distribution ?? {}).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-[#e5e6eb] bg-[#fafbfc] px-4 py-3"
                >
                  <span className="text-sm text-[#4e5969]">{stageLabelMap[key] ?? key}</span>
                  <span className="text-sm font-medium text-[#1d2129]">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#e5e6eb] shadow-none">
            <CardHeader>
              <CardTitle className="text-lg text-[#1d2129]">待处理动作</CardTitle>
              <CardDescription>优先关注高风险或筛选中的候选人</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {dashboard?.pending_actions.length ? (
                dashboard.pending_actions.map((item) => (
                  <div
                    key={`${item.resume_id}-${item.created_at}`}
                    className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[#1d2129]">
                        {item.candidate_name || item.filename}
                      </p>
                      <Badge variant={item.risk_level === "high" ? "warning" : "outline"}>
                        {item.risk_level}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-[#4e5969]">{item.next_action}</p>
                    <p className="mt-1 text-xs text-[#86909c]">
                      {stageLabelMap[item.stage]} · {formatDate(item.created_at)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-[#d9dde4] bg-[#fafbfc] p-6 text-sm text-[#86909c]">
                  当前没有待跟进动作
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader>
            <CardTitle className="text-lg text-[#1d2129]">当前候选人概览</CardTitle>
            <CardDescription>展示当前正在操作的简历快照</CardDescription>
          </CardHeader>
          <CardContent>
            {activeResume ? (
              <div className="grid gap-3 rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4 text-sm text-[#4e5969]">
                <p className="font-medium text-[#1d2129]">{activeResume.filename}</p>
                <p>阶段：{stageLabelMap[activeResume.stage]} · 优先级：{priorityLabelMap[activeResume.priority]}</p>
                <p>最近匹配：{activeResume.latest_match_score !== null ? `${activeResume.latest_match_score} 分` : "暂无匹配"}</p>
                <div className="flex flex-wrap gap-2">
                  {activeResume.tags.length ? (
                    activeResume.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">暂无标签</Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#d9dde4] bg-[#fafbfc] p-6 text-sm text-[#86909c]">
                当前未选中简历
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader>
            <CardTitle className="text-lg text-[#1d2129]">当前匹配结论</CardTitle>
            <CardDescription>展示最近一次匹配的核心结果</CardDescription>
          </CardHeader>
          <CardContent>
            {activeMatch ? (
              <div className="grid gap-3 rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[#1d2129]">{activeMatch.detail.recommendation}</p>
                  <p className="text-2xl font-semibold text-[#1d2129]">{activeMatch.score}</p>
                </div>
                <p className="text-sm text-[#4e5969]">风险等级：{activeMatch.detail.risk_level}</p>
                <p className="text-sm text-[#4e5969]">下一步动作：{activeMatch.detail.next_action}</p>
                <div className="grid gap-2 text-sm text-[#4e5969]">
                  {activeMatch.detail.summary.slice(0, 3).map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#d9dde4] bg-[#fafbfc] p-6 text-sm text-[#86909c]">
                当前还没有匹配结果
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
