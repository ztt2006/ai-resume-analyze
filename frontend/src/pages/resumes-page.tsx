import { FileUp, RefreshCcw } from "lucide-react"
import { type ChangeEvent, type FormEvent } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { compactHash } from "@/lib/format"
import type { HistoryPayload, ResumeUploadData } from "@/types/api"

type ResumesPageProps = {
  activeResume: ResumeUploadData | null
  history: HistoryPayload
  selectedFileName: string
  isUploading: boolean
  errorMessage: string | null
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onUpload: (event: FormEvent<HTMLFormElement>) => void
  onRefresh: () => void
  onPickResume: (resumeId: number) => void
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

function renderProfileValue(value: ResumeUploadData["profile"][keyof ResumeUploadData["profile"]]) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(" / ") || "未识别"
  }
  return value || "未识别"
}

export function ResumesPage({
  activeResume,
  history,
  selectedFileName,
  isUploading,
  errorMessage,
  onFileChange,
  onUpload,
  onRefresh,
  onPickResume,
}: ResumesPageProps) {
  return (
    <div className="grid gap-6">
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
            <CardTitle className="text-lg text-[#1d2129]">上传简历</CardTitle>
            <CardDescription>上传 PDF 并自动完成解析</CardDescription>
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

            <div className="grid gap-2">
              <p className="text-sm font-medium text-[#1d2129]">最近简历</p>
              {history.resumes.length ? (
                <div className="flex flex-wrap gap-2">
                  {history.resumes.slice(0, 8).map((item) => (
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

        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader>
            <CardTitle className="text-lg text-[#1d2129]">解析结果</CardTitle>
            <CardDescription>查看当前简历的结构化信息与标签</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {activeResume ? (
              <>
                <div className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                  <p className="text-sm font-medium text-[#1d2129]">{activeResume.filename}</p>
                  <p className="mt-2 text-sm text-[#4e5969]">Hash：{compactHash(activeResume.text_hash)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
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
                  <p className="text-sm font-medium text-[#1d2129]">强项标签</p>
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
      </div>
    </div>
  )
}
