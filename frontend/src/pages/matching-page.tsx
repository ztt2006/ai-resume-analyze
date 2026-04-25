import { Eye, Radar, X } from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { formatDate, scoreTone } from "@/lib/format"
import type {
  JDTemplateData,
  MatchResponseData,
  ResumeDetailData,
  ResumeHistoryItem,
  ResumeUploadData,
} from "@/types/api"
import { fetchResumeDetail, getResumePreviewUrl } from "@/utils/request"

type MatchingPageProps = {
  activeResume: ResumeUploadData | null
  activeMatch: MatchResponseData | null
  resumes: ResumeHistoryItem[]
  templates: JDTemplateData[]
  jdText: string
  isMatching: boolean
  errorMessage: string | null
  onJdChange: (value: string) => void
  onMatch: () => void
  onPickResume: (resumeId: number) => void
  onUseTemplate: (template: JDTemplateData) => void
}

const PAGE_SIZE = 6

export function MatchingPage({
  activeResume,
  activeMatch,
  resumes,
  templates,
  jdText,
  isMatching,
  errorMessage,
  onJdChange,
  onMatch,
  onPickResume,
  onUseTemplate,
}: MatchingPageProps) {
  const [page, setPage] = useState(1)
  const [previewResume, setPreviewResume] = useState<ResumeDetailData | null>(null)
  const [previewResumeId, setPreviewResumeId] = useState<number | null>(null)
  const [previewMode, setPreviewMode] = useState<"pdf" | "cleaned" | "raw">("pdf")
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const tone = scoreTone(activeMatch?.score ?? 0)

  const totalPages = Math.max(1, Math.ceil(resumes.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedResumes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return resumes.slice(start, start + PAGE_SIZE)
  }, [currentPage, resumes])

  const handlePreviewResume = async (resumeId: number) => {
    setPreviewLoading(true)
    setPreviewError(null)
    setPreviewMode("pdf")
    try {
      const payload = await fetchResumeDetail(resumeId)
      setPreviewResume(payload)
      setPreviewResumeId(resumeId)
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "简历预览加载失败")
      setPreviewResume(null)
      setPreviewResumeId(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const previewText =
    previewMode === "cleaned" ? previewResume?.cleaned_text : previewResume?.raw_text
  const previewUrl = previewResumeId ? getResumePreviewUrl(previewResumeId) : ""

  return (
    <>
      <div className="grid gap-6">
        {errorMessage ? (
          <Card className="border-destructive/20 shadow-none">
            <CardContent className="py-4">
              <p className="text-sm text-destructive">{errorMessage}</p>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader>
            <CardTitle className="text-lg text-[#1d2129]">选择匹配简历</CardTitle>
            <CardDescription>直接从已上传简历中选择，岗位匹配页无需重新上传 PDF</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>候选人</TableHead>
                  <TableHead>文件名</TableHead>
                  <TableHead>预览</TableHead>
                  <TableHead>阶段</TableHead>
                  <TableHead>最近匹配</TableHead>
                  <TableHead>上传时间</TableHead>
                  <TableHead className="w-[180px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedResumes.length ? (
                  pagedResumes.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="grid gap-1">
                          <span className="text-sm font-medium text-[#1d2129]">
                            {item.profile.name || "未识别"}
                          </span>
                          <span className="text-xs text-[#86909c]">
                            {item.profile.job_intention || "暂无求职意向"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#4e5969]">{item.filename}</TableCell>
                      <TableCell>
                        <Badge variant={item.has_preview_file ? "success" : "outline"}>
                          {item.has_preview_file ? "PDF可预览" : "仅文本"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.stage}</Badge>
                      </TableCell>
                      <TableCell className="text-[#4e5969]">
                        {item.latest_match_score !== null ? `${item.latest_match_score} 分` : "暂无"}
                      </TableCell>
                      <TableCell className="text-[#4e5969]">{formatDate(item.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => onPickResume(item.id)}
                            size="sm"
                            type="button"
                            variant={activeResume?.resume_id === item.id ? "default" : "outline"}
                          >
                            {activeResume?.resume_id === item.id ? "已选中" : "选择"}
                          </Button>
                          <Button
                            onClick={() => {
                              void handlePreviewResume(item.id)
                            }}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <Eye data-icon="inline-start" />
                            查看
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="py-10 text-center text-[#86909c]" colSpan={7}>
                      暂无可用于匹配的简历
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#86909c]">
                第 {currentPage} / {totalPages} 页，共 {resumes.length} 份简历
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={currentPage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  type="button"
                  variant="outline"
                >
                  上一页
                </Button>
                <Button
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  type="button"
                  variant="outline"
                >
                  下一页
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card className="border-[#e5e6eb] shadow-none">
            <CardHeader>
              <CardTitle className="text-lg text-[#1d2129]">岗位 JD</CardTitle>
              <CardDescription>选择模板或直接输入岗位 JD</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[#1d2129]">快捷模板</p>
                  <Badge variant="outline">{templates.length} 个</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {templates.map((template) => (
                    <Button
                      key={template.id}
                      onClick={() => onUseTemplate(template)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                <p className="text-sm font-medium text-[#1d2129]">JD 输入区</p>
                <Textarea
                  onChange={(event) => onJdChange(event.target.value)}
                  placeholder="请输入岗位职责和任职要求"
                  value={jdText}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[#86909c]">
                    当前候选人：{activeResume ? activeResume.filename : "系统将自动使用最近一份简历"}
                  </p>
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
              <CardTitle className="text-lg text-[#1d2129]">匹配结果</CardTitle>
              <CardDescription>展示综合分、推荐结论与面试建议</CardDescription>
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
                        <Badge variant="outline">{activeMatch.detail.recommendation}</Badge>
                        <Badge
                          variant={activeMatch.detail.risk_level === "high" ? "warning" : "outline"}
                        >
                          {activeMatch.detail.risk_level}
                        </Badge>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          ["技能匹配", activeMatch.detail.skill_dimension.score],
                          ["经验匹配", activeMatch.detail.experience_dimension.score],
                          ["学历匹配", activeMatch.detail.education_dimension.score],
                        ].map(([label, score]) => (
                          <div
                            key={label}
                            className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-3"
                          >
                            <p className="text-xs text-[#86909c]">{label}</p>
                            <p className="mt-2 text-2xl font-semibold text-[#1d2129]">{score}</p>
                          </div>
                        ))}
                      </div>
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
                          activeMatch.detail.recommendation_reasons.map((item) => (
                            <p key={item}>{item}</p>
                          ))
                        ) : (
                          <p>暂无补充推荐理由</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                      <p className="text-sm font-medium text-[#1d2129]">分析摘要</p>
                      <div className="mt-3 grid gap-2 text-sm text-[#4e5969]">
                        {activeMatch.detail.summary.map((item) => (
                          <p key={item}>{item}</p>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                      <p className="text-sm font-medium text-[#1d2129]">面试问题建议</p>
                      <div className="mt-3 grid gap-2 text-sm text-[#4e5969]">
                        {activeMatch.detail.interview_questions.length ? (
                          activeMatch.detail.interview_questions.map((item) => (
                            <p key={item}>{item}</p>
                          ))
                        ) : (
                          <p>暂无面试问题建议</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-[#d9dde4] bg-[#fafbfc] p-6 text-sm text-[#86909c]">
                  系统会优先沿用你已上传的当前简历，也可以从上方表格切换其他简历进行匹配
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {(previewLoading || previewResume || previewError) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6">
          <Card className="flex max-h-[88vh] w-full max-w-5xl flex-col border-[#d9dde4] shadow-xl">
            <CardHeader className="border-b border-[#e5e6eb]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg text-[#1d2129]">简历查看</CardTitle>
                  <CardDescription>优先展示原始 PDF，加载失败时可切换为文本预览</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setPreviewResume(null)
                    setPreviewError(null)
                    setPreviewLoading(false)
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pt-6">
              {previewLoading ? (
                <div className="rounded-lg border border-[#d9dde4] bg-[#fafbfc] p-8 text-sm text-[#86909c]">
                  正在加载简历内容...
                </div>
              ) : previewError ? (
                <div className="rounded-lg border border-destructive/20 bg-[#fff7f7] p-8 text-sm text-destructive">
                  {previewError}
                </div>
              ) : previewResume ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#1d2129]">
                        {previewResume.filename}
                      </p>
                      <p className="text-xs text-[#86909c]">
                        {previewResume.profile.name || "未识别"} · {previewResume.page_count} 页 ·{" "}
                        {previewResume.has_preview_file ? "原始 PDF 已保存" : "历史数据，仅支持文本预览"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        disabled={!previewResume.has_preview_file}
                        onClick={() => setPreviewMode("pdf")}
                        size="sm"
                        type="button"
                        variant={previewMode === "pdf" ? "default" : "outline"}
                      >
                        PDF 预览
                      </Button>
                      <Button
                        onClick={() => setPreviewMode("cleaned")}
                        size="sm"
                        type="button"
                        variant={previewMode === "cleaned" ? "default" : "outline"}
                      >
                        清洗文本
                      </Button>
                      <Button
                        onClick={() => setPreviewMode("raw")}
                        size="sm"
                        type="button"
                        variant={previewMode === "raw" ? "default" : "outline"}
                      >
                        原始文本
                      </Button>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-[#e5e6eb] bg-[#fafbfc]">
                    {previewMode === "pdf" && previewUrl && previewResume.has_preview_file ? (
                      <iframe
                        className="h-full min-h-[70vh] w-full"
                        src={previewUrl}
                        title={previewResume.filename}
                      />
                    ) : (
                      <div className="p-4 text-sm leading-7 whitespace-pre-wrap text-[#1d2129]">
                        {!previewResume.has_preview_file ? (
                          <div className="mb-4 rounded-lg border border-[#e5e6eb] bg-white p-3 text-sm text-[#4e5969]">
                            这份简历是历史数据，数据库里有解析文本，但原始 PDF 文件未保存，所以当前只能文本预览。
                          </div>
                        ) : null}
                        {previewText}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  )
}
