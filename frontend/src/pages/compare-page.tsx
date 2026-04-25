import { ArrowUpDown } from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type {
  CompareMatchResponseData,
  JDTemplateData,
  ResumeHistoryItem,
} from "@/types/api"
import { compareResumes } from "@/utils/request"

type ComparePageProps = {
  resumes: ResumeHistoryItem[]
  templates: JDTemplateData[]
}

export function ComparePage({ resumes, templates }: ComparePageProps) {
  const [keyword, setKeyword] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [jdText, setJdText] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [result, setResult] = useState<CompareMatchResponseData | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const filteredResumes = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return resumes
    return resumes.filter((item) => {
      return (
        item.filename.toLowerCase().includes(normalized) ||
        (item.profile.name || "").toLowerCase().includes(normalized) ||
        (item.profile.job_intention || "").toLowerCase().includes(normalized) ||
        item.tags.some((tag) => tag.toLowerCase().includes(normalized))
      )
    })
  }, [keyword, resumes])

  const toggleResume = (resumeId: number) => {
    setSelectedIds((current) =>
      current.includes(resumeId)
        ? current.filter((item) => item !== resumeId)
        : [...current, resumeId]
    )
  }

  const handleCompare = async () => {
    setIsComparing(true)
    setErrorMessage(null)
    try {
      const payload = await compareResumes({
        resume_ids: selectedIds,
        jd_text: selectedTemplateId ? undefined : jdText,
        template_id: selectedTemplateId ?? undefined,
      })
      setResult(payload)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "批量对比失败")
    } finally {
      setIsComparing(false)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>候选人数量</CardDescription>
            <CardTitle className="text-2xl text-[#1d2129]">{resumes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>已选人数</CardDescription>
            <CardTitle className="text-2xl text-[#1d2129]">{selectedIds.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>模板数量</CardDescription>
            <CardTitle className="text-2xl text-[#1d2129]">{templates.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>当前 JD 长度</CardDescription>
            <CardTitle className="text-2xl text-[#1d2129]">{jdText.trim().length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader>
            <CardTitle className="text-lg text-[#1d2129]">候选人选择</CardTitle>
            <CardDescription>至少选择 2 份简历进行同岗比较</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Input
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索候选人或标签"
              value={keyword}
            />
            <div className="grid max-h-[620px] gap-3 overflow-auto pr-1">
              {filteredResumes.length ? (
                filteredResumes.map((item) => {
                  const selected = selectedIds.includes(item.id)
                  return (
                    <button
                      key={item.id}
                      className={[
                        "rounded-lg border px-4 py-3 text-left transition-colors",
                        selected
                          ? "border-[#bed0ff] bg-[#edf4ff]"
                          : "border-[#e5e6eb] bg-white hover:bg-[#fafbfc]",
                      ].join(" ")}
                      onClick={() => toggleResume(item.id)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-[#1d2129]">
                          {item.profile.name || item.filename}
                        </p>
                        <Badge variant={selected ? "success" : "outline"}>
                          {selected ? "已选" : "选择"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-[#4e5969]">{item.filename}</p>
                      <p className="mt-1 text-xs text-[#86909c]">
                        {item.profile.job_intention || "暂无求职意向"} · 最近匹配{" "}
                        {item.latest_match_score ?? "--"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="rounded-lg border border-dashed border-[#d9dde4] bg-[#fafbfc] p-6 text-sm text-[#86909c]">
                  暂无符合条件的候选人
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="border-[#e5e6eb] shadow-none">
            <CardHeader>
              <CardTitle className="text-lg text-[#1d2129]">对比条件</CardTitle>
              <CardDescription>可选择模板，也可直接输入 JD</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3">
                <p className="text-sm font-medium text-[#1d2129]">JD 模板</p>
                <div className="flex flex-wrap gap-2">
                  {templates.map((template) => (
                    <Button
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplateId(template.id)
                        setJdText(template.content)
                      }}
                      size="sm"
                      type="button"
                      variant={selectedTemplateId === template.id ? "default" : "outline"}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>

              <Textarea
                onChange={(event) => {
                  setSelectedTemplateId(null)
                  setJdText(event.target.value)
                }}
                placeholder="输入用于批量对比的岗位 JD"
                value={jdText}
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[#86909c]">已选择 {selectedIds.length} 位候选人</p>
                <Button
                  disabled={isComparing || selectedIds.length < 2 || jdText.trim().length < 10}
                  onClick={handleCompare}
                  type="button"
                >
                  <ArrowUpDown data-icon="inline-start" />
                  {isComparing ? "对比中..." : "开始对比"}
                </Button>
              </div>

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-[#e5e6eb] shadow-none">
              <CardHeader className="pb-2">
                <CardDescription>Top 候选人</CardDescription>
                <CardTitle className="text-lg text-[#1d2129]">
                  {result?.top_candidate_name || "--"}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-[#e5e6eb] shadow-none">
              <CardHeader className="pb-2">
                <CardDescription>平均分</CardDescription>
                <CardTitle className="text-2xl text-[#1d2129]">
                  {result?.average_score ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-[#e5e6eb] shadow-none">
              <CardHeader className="pb-2">
                <CardDescription>推荐人数</CardDescription>
                <CardTitle className="text-2xl text-[#1d2129]">
                  {result?.recommended_count ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-[#e5e6eb] shadow-none">
              <CardHeader className="pb-2">
                <CardDescription>高风险人数</CardDescription>
                <CardTitle className="text-2xl text-[#1d2129]">
                  {result?.high_risk_count ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="border-[#e5e6eb] shadow-none">
            <CardHeader>
              <CardTitle className="text-lg text-[#1d2129]">对比结果</CardTitle>
              <CardDescription>按综合分从高到低展示候选人排序</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {result ? (
                result.ranking.map((item, index) => (
                  <div key={item.resume_id} className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={index === 0 ? "success" : "outline"}>第 {index + 1} 名</Badge>
                          <p className="text-sm font-medium text-[#1d2129]">
                            {item.candidate_name || item.resume_filename}
                          </p>
                          <Badge variant={item.risk_level === "high" ? "warning" : "outline"}>
                            {item.risk_level}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-[#4e5969]">{item.resume_filename}</p>
                        <p className="mt-1 text-xs text-[#86909c]">{item.recommendation}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#86909c]">综合分</p>
                        <p className="text-2xl font-semibold text-[#1d2129]">{item.score}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {[
                        ["技能", item.skill_dimension.score],
                        ["经验", item.experience_dimension.score],
                        ["学历", item.education_dimension.score],
                      ].map(([label, score]) => (
                        <div key={label} className="rounded-md bg-white px-3 py-3">
                          <p className="text-xs text-[#86909c]">{label}</p>
                          <p className="mt-1 text-lg font-semibold text-[#1d2129]">{score}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
                      <div>
                        <p className="text-sm font-medium text-[#1d2129]">亮点 / 风险</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.strengths.map((tag) => (
                            <Badge key={tag} variant="success">
                              {tag}
                            </Badge>
                          ))}
                          {item.risks.map((tag) => (
                            <Badge key={tag} variant="warning">
                              {tag}
                            </Badge>
                          ))}
                          {!item.strengths.length && !item.risks.length ? (
                            <Badge variant="secondary">暂无标签</Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="rounded-md bg-white px-3 py-3">
                        <p className="text-xs text-[#86909c]">建议动作</p>
                        <p className="mt-1 text-sm text-[#1d2129]">{item.next_action}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-[#d9dde4] bg-[#fafbfc] p-6 text-sm text-[#86909c]">
                  选择候选人并输入 JD 后，这里会展示排名结果
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
