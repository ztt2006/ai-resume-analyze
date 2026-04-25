import { FilePlus2, PencilLine, Save } from "lucide-react"
import { type FormEvent, useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { JDTemplateData } from "@/types/api"

type TemplatesPageProps = {
  templates: JDTemplateData[]
  errorMessage: string | null
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

export function TemplatesPage({
  templates,
  errorMessage,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
}: TemplatesPageProps) {
  const [templateName, setTemplateName] = useState("")
  const [templateCategory, setTemplateCategory] = useState("研发")
  const [templateTags, setTemplateTags] = useState("")
  const [templateContent, setTemplateContent] = useState("")
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const resetForm = () => {
    setEditingTemplateId(null)
    setTemplateName("")
    setTemplateCategory("研发")
    setTemplateTags("")
    setTemplateContent("")
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
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
      resetForm()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
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
            <CardTitle className="text-lg text-[#1d2129]">模板列表</CardTitle>
            <CardDescription>集中维护所有 JD 模板</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {templates.length ? (
              templates.map((template) => (
                <div key={template.id} className="rounded-lg border border-[#e5e6eb] bg-[#fafbfc] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#1d2129]">{template.name}</p>
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
                  <p className="mt-3 line-clamp-3 text-sm text-[#4e5969]">{template.content}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[#d9dde4] bg-[#fafbfc] p-6 text-sm text-[#86909c]">
                暂无模板
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#e5e6eb] shadow-none">
        <CardHeader>
          <CardTitle className="text-lg text-[#1d2129]">
            {editingTemplateId ? "编辑模板" : "新建模板"}
          </CardTitle>
          <CardDescription>单独维护模板，不再挤在首页中</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={handleSubmit}>
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
                  isSubmitting ||
                  templateName.trim().length < 2 ||
                  templateContent.trim().length < 20
                }
                type="submit"
              >
                {editingTemplateId ? <Save data-icon="inline-start" /> : <FilePlus2 data-icon="inline-start" />}
                {isSubmitting ? "提交中..." : editingTemplateId ? "保存修改" : "创建模板"}
              </Button>
              {editingTemplateId ? (
                <Button onClick={resetForm} type="button" variant="outline">
                  取消编辑
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
