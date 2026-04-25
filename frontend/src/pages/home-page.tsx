import { FilePlus2, FileUp, PencilLine, Radar, RefreshCcw, Save } from "lucide-react"
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { compactHash, formatDate, scoreTone } from "@/lib/format"
import type {
  DashboardOverview,
  HistoryPayload,
  JDTemplateData,
  MatchResponseData,
  ResumeUploadData,
} from "@/types/api"

type HomePageProps = {
  activeResume: ResumeUploadData | null
  activeMatch: MatchResponseData | null
  dashboard: DashboardOverview | null
  history: HistoryPayload
  templates: JDTemplateData[]
  jdText: string
  selectedFileName: string
  isUploading: boolean
  isMatching: boolean
  errorMessage: string | null
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onUpload: (event: FormEvent<HTMLFormElement>) => void
  onJdChange: (value: string) => void
  onMatch: () => void
  onRefresh: () => void
  onPickResume: (resumeId: number) => void
  onUseTemplate: (template: JDTemplateData) => void
  onCreateTemplate: (payload: {
    name: string
    category: string
    content: string
    tags: string[]
  }) => Promise<void>
  onUpdateTemplate: (
    templateId: number,
    payload: Partial<Pick<JDTemplateData, "name" | "category" | "content" | "tags">>
  ) => Promise<void>
  onDeleteTemplate: (templateId: number) => Promise<void>
}

const basicProfileLabels: Array<[label: string, key: keyof ResumeUploadData["profile"]]> = [
  ["姓名", "name"],
  ["电话", "phone"],
  ["邮箱", "email"],
  ["联系地址", "address"],
]

const extraProfileLabels: Array<[label: string, key: keyof ResumeUploadData["profile"]]> = [
  ["学历背景", "education_background"],
  ["工作年限", "years_of_experience"],
  ["项目经历", "project_experience"],
  ["求职意向", "job_intention"],
  ["期望薪资", "expected_salary"],
]

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

function renderProfileValue(value: ResumeUploadData["profile"][keyof ResumeUploadData["profile"]]) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(" / ") || "未识别"
  }
  return value || "未识别"
}

export function HomePage({
  activeResume,
  activeMatch,
  dashboard,
  history,
  templates,
  jdText,
  selectedFileName,
  isUploading,
  isMatching,
  errorMessage,
  onFileChange,
  onUpload,
  onJdChange,
  onMatch,
  onRefresh,
  onPickResume,
  onUseTemplate,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
}: HomePageProps) {
  const [templateName, setTemplateName] = useState("")
  const [templateCategory, setTemplateCategory] = useState("研发")
  const [templateTags, setTemplateTags] = useState("")
  const [templateContent, setTemplateContent] = useState("")
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null)
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)

  const tone = scoreTone(activeMatch?.score ?? 0)

  useEffect(() => {
    if (!editingTemplateId) {
      return
    }
    const target = templates.find((item) => item.id === editingTemplateId)
    if (!target) {
      setEditingTemplateId(null)
      return
    }
    setTemplateName(target.name)
    setTemplateCategory(target.category)
    setTemplateTags(target.tags.join(", "))
    setTemplateContent(target.content)
  }, [editingTemplateId, templates])

  const resetTemplateForm = () => {
    setEditingTemplateId(null)
    setTemplateName("")
    setTemplateCategory("研发")
    setTemplateTags("")
    setTemplateContent("")
  }

  const handleTemplateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsCreatingTemplate(true)
    try {
      const payload = {
        name: templateName,
        category: templateCategory,
        content: templateContent,
        tags: templateTags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }
      if (editingTemplateId) {
        await onUpdateTemplate(editingTemplateId, payload)
      } else {
        await onCreateTemplate(payload)
      }
      resetTemplateForm()
    } finally {
      setIsCreatingTemplate(false)
    }
  }

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

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader>
            <CardTitle className="text-lg text-[#1d2129]">简历管理</CardTitle>
            <CardDescription>上传简历并切换当前候选人</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form className="grid gap-4" onSubmit={onUpload}>
              <label className="grid cursor-pointer gap-3 rounded-lg border border-dashed border-[#c9cdd4] bg-[#fafbfc] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#edf4ff] text-primary">
                    <FileUp className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1d2129]">选择 PDF 简历</p>
                    <p className="text-xs text-[#86909c]">支持重复简历缓存识别与多页解析</p>
                  </div>
                </div>
                <input
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={onFileChange}
                  type="file"
                />
                <div className="rounded-lg border border-[#e5e6eb] bg-white px-3 py-2 text-sm text-[#4e5969]">
                  {selectedFileName || "尚未选择文件"}
                </div>
              </label>

              <div className="flex flex-wrap gap-2">
                <Button disabled={isUploading || !selectedFileName} type="submit">
                  <FileUp data-icon="inline-start" />
                  {isUploading ? "解析中..." : "上传并解析"}
                </Button>
                <Button onClick={onRefresh} type="button" variant="outline">
                  <RefreshCcw data-icon="inline-start" />
                  刷新
                </Button>
              </div>
            </form>

            <div className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#1d2129]">当前候选人</p>
                <Badge variant="outline">{dashboard?.cache_backend ?? "cache"}</Badge>
              </div>
              {activeResume ? (
                <div className="mt-3 grid gap-2 text-sm text-[#4e5969]">
                  <p className="font-medium text-[#1d2129]">{activeResume.filename}</p>
                  <p>Hash：{compactHash(activeResume.text_hash)}</p>
                  <p>
                    阶段：{stageLabelMap[activeResume.stage]} · 优先级：{priorityLabelMap[activeResume.priority]}
                  </p>
                  <p>
                    最近匹配：
                    {activeResume.latest_match_score !== null
                      ? `${activeResume.latest_match_score} 分`
                      : "暂无匹配"}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant={activeResume.cache_hit ? "success" : "outline"}>
                      {activeResume.cache_hit ? "命中缓存" : "新鲜解析"}
                    </Badge>
                    <Badge variant={activeResume.duplicate ? "warning" : "outline"}>
                      {activeResume.duplicate ? "重复简历" : "当前简历"}
                    </Badge>
                    {activeResume.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#86909c]">尚未选择简历</p>
              )}
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-medium text-[#1d2129]">最近简历</p>
              {history.resumes.length ? (
                <div className="flex flex-wrap gap-2">
                  {history.resumes.slice(0, 6).map((item) => (
                    <Button
                      key={item.id}
                      onClick={() => onPickResume(item.id)}
                      size="sm"
                      type="button"
                      variant={activeResume?.resume_id === item.id ? "default" : "outline"}
                    >
                      {item.profile.name || item.filename}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#86909c]">暂无历史简历</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            <Card className="border-[#e5e6eb] shadow-none">
              <CardHeader>
                <CardTitle className="text-lg text-[#1d2129]">岗位匹配</CardTitle>
                <CardDescription>选择模板或直接输入岗位 JD</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[#1d2129]">JD 模板</p>
                    <Badge variant="outline">{templates.length} 个</Badge>
                  </div>
                  {templates.length ? (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {templates.slice(0, 4).map((template) => (
                        <div
                          key={template.id}
                          className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#1d2129]">
                                {template.name}
                              </p>
                              <p className="text-xs text-[#86909c]">{template.category}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                onClick={() => setEditingTemplateId(template.id)}
                                size="icon-sm"
                                type="button"
                                variant="ghost"
                              >
                                <PencilLine className="size-4" />
                              </Button>
                              <Button
                                onClick={() => void onDeleteTemplate(template.id)}
                                size="sm"
                                type="button"
                                variant="ghost"
                              >
                                删除
                              </Button>
                            </div>
                          </div>
                          <p className="mt-3 line-clamp-2 text-sm text-[#4e5969]">
                            {template.content}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {template.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="mt-4">
                            <Button onClick={() => onUseTemplate(template)} size="sm" type="button">
                              使用模板
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-[#d9dde4] bg-[#fafbfc] p-4 text-sm text-[#86909c]">
                      暂无模板
                    </div>
                  )}
                </div>

                <div className="grid gap-3 rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                  <p className="text-sm font-medium text-[#1d2129]">岗位 JD</p>
                  <Textarea
                    onChange={(event) => onJdChange(event.target.value)}
                    placeholder="请输入岗位职责和任职要求"
                    value={jdText}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-[#86909c]">当前字数：{jdText.trim().length}</p>
                    <Button
                      disabled={isMatching || !activeResume || jdText.trim().length < 10}
                      onClick={onMatch}
                      type="button"
                    >
                      <Radar data-icon="inline-start" />
                      {isMatching ? "分析中..." : "生成评分"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#e5e6eb] shadow-none">
              <CardHeader>
                <CardTitle className="text-lg text-[#1d2129]">
                  {editingTemplateId ? "编辑模板" : "新建模板"}
                </CardTitle>
                <CardDescription>维护岗位模板，支持新建与更新</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-3" onSubmit={handleTemplateSubmit}>
                  <Input
                    onChange={(event) => setTemplateName(event.target.value)}
                    placeholder="模板名称"
                    value={templateName}
                  />
                  <Input
                    onChange={(event) => setTemplateCategory(event.target.value)}
                    placeholder="模板分类"
                    value={templateCategory}
                  />
                  <Input
                    onChange={(event) => setTemplateTags(event.target.value)}
                    placeholder="标签，使用逗号分隔"
                    value={templateTags}
                  />
                  <Textarea
                    onChange={(event) => setTemplateContent(event.target.value)}
                    placeholder="输入 JD 模板全文"
                    value={templateContent}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={
                        isCreatingTemplate ||
                        templateName.trim().length < 2 ||
                        templateContent.trim().length < 20
                      }
                      type="submit"
                    >
                      {editingTemplateId ? (
                        <Save data-icon="inline-start" />
                      ) : (
                        <FilePlus2 data-icon="inline-start" />
                      )}
                      {isCreatingTemplate ? "提交中..." : editingTemplateId ? "保存修改" : "创建模板"}
                    </Button>
                    {editingTemplateId ? (
                      <Button onClick={resetTemplateForm} type="button" variant="outline">
                        取消编辑
                      </Button>
                    ) : null}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

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
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader>
            <CardTitle className="text-lg text-[#1d2129]">解析结果</CardTitle>
            <CardDescription>按基础信息和补充信息展示 AI 提取内容</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {activeResume ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                    <p className="mb-3 text-sm font-medium text-[#1d2129]">基础信息</p>
                    <div className="grid gap-3">
                      {basicProfileLabels.map(([label, key]) => (
                        <div key={label} className="rounded-md bg-white px-3 py-2">
                          <p className="text-xs text-[#86909c]">{label}</p>
                          <p className="mt-1 text-sm text-[#1d2129]">
                            {renderProfileValue(activeResume.profile[key])}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                    <p className="mb-3 text-sm font-medium text-[#1d2129]">补充信息</p>
                    <div className="grid gap-3">
                      {extraProfileLabels.map(([label, key]) => (
                        <div key={label} className="rounded-md bg-white px-3 py-2">
                          <p className="text-xs text-[#86909c]">{label}</p>
                          <p className="mt-1 text-sm text-[#1d2129]">
                            {renderProfileValue(activeResume.profile[key])}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                  <p className="text-sm font-medium text-[#1d2129]">候选人标签</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeResume.profile.strengths.length ? (
                      activeResume.profile.strengths.map((item) => (
                        <Badge key={item} variant="success">
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary">暂无明显强项</Badge>
                    )}
                    {activeResume.tags.map((item) => (
                      <Badge key={item} variant="outline">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-[#d9dde4] bg-[#fafbfc] p-6 text-sm text-[#86909c]">
                上传或选择一份简历后，这里会显示结构化结果
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader>
            <CardTitle className="text-lg text-[#1d2129]">匹配结果</CardTitle>
            <CardDescription>展示综合分、维度分和处理建议</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {activeMatch ? (
              <>
                <div className="grid gap-4 md:grid-cols-[140px_minmax(0,1fr)]">
                  <div
                    className={[
                      "flex h-[140px] items-center justify-center rounded-lg border text-4xl font-semibold",
                      tone === "strong" && "border-[#bed0ff] bg-[#edf4ff] text-primary",
                      tone === "balanced" && "border-[#d9dde4] bg-[#f7f8fa] text-[#1d2129]",
                      tone === "cautious" && "border-[#d9dde4] bg-[#fafbfc] text-[#4e5969]",
                    ].join(" ")}
                  >
                    {activeMatch.score}
                  </div>

                  <div className="grid gap-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">匹配 ID #{activeMatch.match_id}</Badge>
                      <Badge variant={activeMatch.cache_hit ? "success" : "outline"}>
                        {activeMatch.cache_hit ? "缓存返回" : "新生成"}
                      </Badge>
                      <Badge variant={activeMatch.duplicate ? "warning" : "outline"}>
                        {activeMatch.duplicate ? "重复 JD" : "首次匹配"}
                      </Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ["技能匹配", activeMatch.detail.skill_dimension.score],
                        ["经验匹配", activeMatch.detail.experience_dimension.score],
                        ["学历匹配", activeMatch.detail.education_dimension.score],
                      ].map(([label, score]) => (
                        <div key={label} className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-3">
                          <p className="text-xs text-[#86909c]">{label}</p>
                          <p className="mt-2 text-2xl font-semibold text-[#1d2129]">{score}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                    <p className="text-sm font-medium text-[#1d2129]">优势亮点</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeMatch.detail.strengths.length ? (
                        activeMatch.detail.strengths.map((item) => (
                          <Badge key={item} variant="success">
                            {item}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary">暂无明显亮点</Badge>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                    <p className="text-sm font-medium text-[#1d2129]">风险提示</p>
                    <p className="mt-2 text-sm text-[#86909c]">
                      风险等级：{activeMatch.detail.risk_level}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeMatch.detail.risks.length ? (
                        activeMatch.detail.risks.map((item) => (
                          <Badge key={item} variant="warning">
                            {item}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="success">暂无明显风险</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                  <p className="text-sm font-medium text-[#1d2129]">分析摘要</p>
                  <div className="mt-3 grid gap-2 text-sm text-[#4e5969]">
                    {activeMatch.detail.summary.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                    <p className="text-sm font-medium text-[#1d2129]">推荐结论与动作</p>
                    <div className="mt-3 grid gap-2 text-sm text-[#4e5969]">
                      <p>推荐结论：{activeMatch.detail.recommendation}</p>
                      <p>下一步：{activeMatch.detail.next_action}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                    <p className="text-sm font-medium text-[#1d2129]">推荐理由</p>
                    <div className="mt-3 grid gap-2 text-sm text-[#4e5969]">
                      {activeMatch.detail.recommendation_reasons.length ? (
                        activeMatch.detail.recommendation_reasons.map((item) => <p key={item}>{item}</p>)
                      ) : (
                        <p>暂无补充推荐理由</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                    <p className="text-sm font-medium text-[#1d2129]">面试问题建议</p>
                    <div className="mt-3 grid gap-2 text-sm text-[#4e5969]">
                      {activeMatch.detail.interview_questions.length ? (
                        activeMatch.detail.interview_questions.map((item) => <p key={item}>{item}</p>)
                      ) : (
                        <p>暂无面试问题建议</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                    <p className="text-sm font-medium text-[#1d2129]">JD 核心要求</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeMatch.detail.jd_analysis.core_skills.map((item) => (
                        <Badge key={item} variant="outline">
                          {item}
                        </Badge>
                      ))}
                      {activeMatch.detail.jd_analysis.qualification_keywords.map((item) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-[#d9dde4] bg-[#fafbfc] p-6 text-sm text-[#86909c]">
                选择简历并填写 JD 后，这里会展示匹配评分和分析结论
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
