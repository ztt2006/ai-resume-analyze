import { FileText, Save, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/format"
import type {
  ResumeDetailData,
  ResumePriority,
  ResumeStage,
  ResumeUploadData,
} from "@/types/api"
import { fetchResumeDetail } from "@/utils/request"

type ResumeDetailPageProps = {
  onActivateResume: (payload: ResumeUploadData) => void
  onUpdateResume: (
    resumeId: number,
    payload: Partial<{
      filename: string
      stage: ResumeStage
      priority: ResumePriority
      tags: string[]
      notes: string | null
    }>
  ) => Promise<void>
  onDeleteResume: (resumeId: number) => Promise<void>
}

const baseFields = [
  ["姓名", "name"],
  ["电话", "phone"],
  ["邮箱", "email"],
  ["地址", "address"],
  ["学历背景", "education_background"],
  ["工作年限", "years_of_experience"],
  ["求职意向", "job_intention"],
  ["期望薪资", "expected_salary"],
] as const

export function ResumeDetailPage({
  onActivateResume,
  onUpdateResume,
  onDeleteResume,
}: ResumeDetailPageProps) {
  const { resumeId } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<ResumeDetailData | null>(null)
  const [filename, setFilename] = useState("")
  const [stage, setStage] = useState<ResumeStage>("new")
  const [priority, setPriority] = useState<ResumePriority>("medium")
  const [tags, setTags] = useState("")
  const [notes, setNotes] = useState("")
  const [viewMode, setViewMode] = useState<"cleaned" | "raw">("cleaned")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!resumeId) return
      try {
        const data = await fetchResumeDetail(Number(resumeId))
        setDetail(data)
        setFilename(data.filename)
        setStage(data.stage)
        setPriority(data.priority)
        setTags(data.tags.join(", "))
        setNotes(data.notes || "")
        setErrorMessage(null)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "详情加载失败")
      }
    }
    void load()
  }, [resumeId])

  if (!resumeId) {
    return null
  }

  const activeText = viewMode === "cleaned" ? detail?.cleaned_text : detail?.raw_text

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#1d2129]">简历详情</h2>
          <p className="text-sm text-[#86909c]">查看文本、结构化信息、管理信息与近期匹配记录</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/history">返回历史记录</Link>
        </Button>
      </div>

      {errorMessage ? (
        <Card className="border-destructive/20 shadow-none">
          <CardContent className="py-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      {detail ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="grid gap-6">
              <Card className="border-[#e5e6eb] shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg text-[#1d2129]">简历管理信息</CardTitle>
                  <CardDescription>管理候选人阶段、优先级、标签与备注</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Input onChange={(event) => setFilename(event.target.value)} value={filename} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      className="h-10 rounded-md border border-[#d9dde4] bg-white px-3 text-sm text-[#1d2129]"
                      onChange={(event) => setStage(event.target.value as ResumeStage)}
                      value={stage}
                    >
                      <option value="new">新入库</option>
                      <option value="screening">筛选中</option>
                      <option value="interview">面试中</option>
                      <option value="offer">待发 Offer</option>
                      <option value="rejected">已淘汰</option>
                    </select>
                    <select
                      className="h-10 rounded-md border border-[#d9dde4] bg-white px-3 text-sm text-[#1d2129]"
                      onChange={(event) => setPriority(event.target.value as ResumePriority)}
                      value={priority}
                    >
                      <option value="low">低优先级</option>
                      <option value="medium">中优先级</option>
                      <option value="high">高优先级</option>
                    </select>
                  </div>
                  <Input
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="标签，使用逗号分隔"
                    value={tags}
                  />
                  <Textarea
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="输入候选人备注"
                    value={notes}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={isSaving}
                      onClick={async () => {
                        setIsSaving(true)
                        try {
                          await onUpdateResume(detail.resume_id, {
                            filename,
                            stage,
                            priority,
                            tags: tags
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean),
                            notes: notes || null,
                          })
                          const data = await fetchResumeDetail(detail.resume_id)
                          setDetail(data)
                        } finally {
                          setIsSaving(false)
                        }
                      }}
                      type="button"
                    >
                      <Save data-icon="inline-start" />
                      {isSaving ? "保存中..." : "保存管理信息"}
                    </Button>
                    <Button onClick={() => onActivateResume(detail)} type="button" variant="outline">
                      <FileText data-icon="inline-start" />
                      设为当前
                    </Button>
                    <Button
                      onClick={async () => {
                        await onDeleteResume(detail.resume_id)
                        navigate("/history")
                      }}
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 data-icon="inline-start" />
                      删除
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Hash {detail.text_hash.slice(0, 12)}</Badge>
                    <Badge variant="outline">页数 {detail.page_count}</Badge>
                    <Badge variant="outline">{formatDate(detail.created_at)}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#e5e6eb] shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg text-[#1d2129]">结构化信息</CardTitle>
                  <CardDescription>查看 AI 提取出的基础字段</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {baseFields.map(([label, key]) => {
                    const value = detail.profile[key]
                    const display = Array.isArray(value) ? value.join(" / ") || "未识别" : value || "未识别"

                    return (
                      <div key={label} className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-3">
                        <p className="text-xs text-[#86909c]">{label}</p>
                        <p className="mt-1 text-sm text-[#1d2129]">{display}</p>
                      </div>
                    )
                  })}

                  <div className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-3">
                    <p className="text-xs text-[#86909c]">标签</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {detail.profile.strengths.map((item) => (
                        <Badge key={item} variant="success">
                          {item}
                        </Badge>
                      ))}
                      {detail.tags.map((item) => (
                        <Badge key={item} variant="outline">
                          {item}
                        </Badge>
                      ))}
                      {!detail.profile.strengths.length && !detail.tags.length ? (
                        <Badge variant="secondary">暂无</Badge>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6">
              <Card className="border-[#e5e6eb] shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg text-[#1d2129]">文本内容</CardTitle>
                  <CardDescription>可在清洗文本和原始文本之间切换</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => setViewMode("cleaned")}
                      size="sm"
                      type="button"
                      variant={viewMode === "cleaned" ? "default" : "outline"}
                    >
                      清洗文本
                    </Button>
                    <Button
                      onClick={() => setViewMode("raw")}
                      size="sm"
                      type="button"
                      variant={viewMode === "raw" ? "default" : "outline"}
                    >
                      原始文本
                    </Button>
                  </div>
                  <div className="max-h-[360px] overflow-auto rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4 text-sm leading-7 whitespace-pre-wrap text-[#1d2129]">
                    {activeText}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#e5e6eb] shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg text-[#1d2129]">近期匹配记录</CardTitle>
                  <CardDescription>展示推荐结论、风险等级和面试问题</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {detail.recent_matches.length ? (
                    detail.recent_matches.map((item) => (
                      <div key={item.id} className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-[#1d2129]">{item.recommendation}</p>
                            <p className="mt-1 text-xs text-[#86909c]">{formatDate(item.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-semibold text-[#1d2129]">{item.score}</p>
                            <Badge variant={item.risk_level === "high" ? "warning" : "outline"}>
                              {item.risk_level}
                            </Badge>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-[#4e5969]">{item.jd_excerpt}</p>
                        <p className="mt-3 text-sm text-[#1d2129]">建议动作：{item.next_action}</p>
                        <div className="mt-3 grid gap-2 text-sm text-[#4e5969]">
                          {item.interview_questions.length ? (
                            item.interview_questions.map((question) => <p key={question}>{question}</p>)
                          ) : (
                            <p>暂无面试问题建议</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-[#d9dde4] bg-[#fafbfc] p-6 text-sm text-[#86909c]">
                      这份简历还没有匹配记录
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <Card className="border-[#e5e6eb] shadow-none">
          <CardContent className="py-10 text-sm text-[#86909c]">正在加载简历详情...</CardContent>
        </Card>
      )}
    </div>
  )
}
