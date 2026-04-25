import type { ReactNode } from "react"
import {
  BarChart3,
  Files,
  FolderKanban,
  GitCompareArrows,
  History,
  Layers3,
  LoaderCircle,
  PanelLeft,
  ScanSearch,
} from "lucide-react"
import {
  type ChangeEvent,
  type FormEvent,
  startTransition,
  useEffect,
  useState,
} from "react"
import { HashRouter, NavLink, Route, Routes, useLocation } from "react-router"

import { Badge } from "@/components/ui/badge"
import { ComparePage } from "@/pages/compare-page"
import { HistoryPage } from "@/pages/history-page"
import { MatchingPage } from "@/pages/matching-page"
import { OverviewPage } from "@/pages/overview-page"
import { ResumeDetailPage } from "@/pages/resume-detail-page"
import { ResumesPage } from "@/pages/resumes-page"
import { TemplatesPage } from "@/pages/templates-page"
import type {
  DashboardOverview,
  HistoryPayload,
  JDTemplateData,
  MatchResponseData,
  ResumeUploadData,
} from "@/types/api"
import {
  createMatch,
  createTemplate,
  deleteResume,
  deleteTemplate,
  fetchDashboardOverview,
  fetchHistory,
  fetchResumeDetail,
  fetchTemplates,
  updateResume,
  updateTemplate,
  uploadResume,
} from "@/utils/request"

const emptyHistory: HistoryPayload = { resumes: [], matches: [] }
const ACTIVE_RESUME_STORAGE_KEY = "ai-resume-active-id"

const navItems = [
  { to: "/", label: "概览", icon: BarChart3, description: "核心统计与待办" },
  { to: "/resumes", label: "简历管理", icon: Files, description: "上传与解析结果" },
  { to: "/matching", label: "岗位匹配", icon: ScanSearch, description: "JD 评分与建议" },
  { to: "/templates", label: "模板中心", icon: FolderKanban, description: "JD 模板维护" },
  { to: "/compare", label: "批量对比", icon: GitCompareArrows, description: "候选人比较" },
  { to: "/history", label: "历史记录", icon: History, description: "数据回溯" },
]

const pageMeta: Record<string, { title: string; description: string }> = {
  "/": { title: "概览", description: "查看核心统计、推荐候选人与待处理动作" },
  "/resumes": { title: "简历管理", description: "上传简历、切换当前候选人、查看解析结果" },
  "/matching": { title: "岗位匹配", description: "输入 JD 并查看匹配评分和推荐建议" },
  "/templates": { title: "模板中心", description: "维护 JD 模板并快速回填到匹配流程" },
  "/compare": { title: "批量对比", description: "同一岗位下比较多位候选人" },
  "/history": { title: "历史记录", description: "查看历史简历与匹配数据" },
}

function AppShell({
  children,
  dashboard,
}: {
  children: ReactNode
  dashboard: DashboardOverview | null
}) {
  const location = useLocation()
  const detailPage = location.pathname.startsWith("/resumes/")
  const currentMeta = detailPage
    ? {
        title: "简历详情",
        description: "查看简历文本、结构化信息与近期匹配记录",
      }
    : pageMeta[location.pathname] ?? pageMeta["/"]

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[1600px]">
      <aside className="hidden w-64 shrink-0 border-r border-[#e5e6eb] bg-white lg:block">
        <div className="sticky top-0 flex h-svh flex-col px-4 py-6">
          <div className="flex items-center gap-3 px-3 pb-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Layers3 className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1d2129]">AI简历分析系统</p>
              <p className="text-xs text-[#86909c]">招聘管理后台</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {navItems.map(({ to, label, icon: Icon, description }) => (
              <NavLink key={to} to={to}>
                {({ isActive }) => (
                  <div
                    className={[
                      "flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors",
                      isActive
                        ? "border-[#bed0ff] bg-[#edf4ff]"
                        : "border-transparent hover:bg-[#f7f8fa]",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex size-9 items-center justify-center rounded-lg",
                        isActive ? "bg-primary text-white" : "bg-[#f2f3f5] text-[#4e5969]",
                      ].join(" ")}
                    >
                      <Icon className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1d2129]">{label}</p>
                      <p className="text-xs text-[#86909c]">{description}</p>
                    </div>
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-xl border border-[#e5e6eb] bg-[#fafbfc] p-4">
            <p className="text-xs text-[#86909c]">简历总数</p>
            <p className="mt-1 text-lg font-semibold text-[#1d2129]">
              {dashboard?.total_resumes ?? 0}
            </p>
            <p className="mt-3 text-xs text-[#86909c]">匹配总数</p>
            <p className="mt-1 text-lg font-semibold text-[#1d2129]">
              {dashboard?.total_matches ?? 0}
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[#e5e6eb] bg-white">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#edf4ff] text-primary lg:hidden">
                <PanelLeft className="size-4.5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#1d2129]">{currentMeta.title}</h1>
                <p className="text-sm text-[#86909c]">{currentMeta.description}</p>
              </div>
            </div>
            <Badge variant="outline">{dashboard?.cache_backend ?? "cache"}</Badge>
          </div>
        </header>

        <main className="flex-1 bg-[#f5f7fa] px-4 py-6 sm:px-6 xl:px-8">
          <div className="min-w-0">{children}</div>
        </main>
      </div>
    </div>
  )
}

function App() {
  const [history, setHistory] = useState<HistoryPayload>(emptyHistory)
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null)
  const [templates, setTemplates] = useState<JDTemplateData[]>([])
  const [activeResume, setActiveResume] = useState<ResumeUploadData | null>(null)
  const [activeMatch, setActiveMatch] = useState<MatchResponseData | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [jdText, setJdText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isMatching, setIsMatching] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const persistActiveResumeId = (resumeId: number | null) => {
    if (typeof window === "undefined") {
      return
    }

    if (resumeId === null) {
      window.localStorage.removeItem(ACTIVE_RESUME_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(ACTIVE_RESUME_STORAGE_KEY, String(resumeId))
  }

  const readPersistedResumeId = () => {
    if (typeof window === "undefined") {
      return null
    }

    const rawValue = window.localStorage.getItem(ACTIVE_RESUME_STORAGE_KEY)
    if (!rawValue) {
      return null
    }

    const parsedValue = Number(rawValue)
    return Number.isFinite(parsedValue) ? parsedValue : null
  }

  const refreshWorkspace = async () => {
    const [historyData, dashboardData, templateData] = await Promise.all([
      fetchHistory(),
      fetchDashboardOverview(),
      fetchTemplates(),
    ])
    startTransition(() => {
      setHistory(historyData)
      setDashboard(dashboardData)
      setTemplates(templateData)
    })
    return { historyData, dashboardData, templateData }
  }

  useEffect(() => {
    if (isBootstrapping) {
      return
    }

    if (!history.resumes.length) {
      if (activeResume) {
        setActiveResume(null)
        setActiveMatch(null)
      }
      persistActiveResumeId(null)
      return
    }

    const activeResumeStillExists = activeResume
      ? history.resumes.some((item) => item.id === activeResume.resume_id)
      : false

    if (activeResumeStillExists) {
      return
    }

    const persistedResumeId = readPersistedResumeId()
    const fallbackResumeId =
      history.resumes.find((item) => item.id === persistedResumeId)?.id ?? history.resumes[0]?.id

    if (!fallbackResumeId) {
      return
    }

    let cancelled = false

    const restoreResume = async () => {
      try {
        const response = await fetchResumeDetail(fallbackResumeId)
        if (cancelled) {
          return
        }
        setActiveResume(response)
        setActiveMatch(null)
        persistActiveResumeId(fallbackResumeId)
      } catch {
        if (cancelled) {
          return
        }
        setActiveResume(null)
        setActiveMatch(null)
        persistActiveResumeId(null)
      }
    }

    void restoreResume()

    return () => {
      cancelled = true
    }
  }, [activeResume, history.resumes, isBootstrapping])

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setErrorMessage(null)
        const { historyData } = await refreshWorkspace()
        const persistedResumeId = readPersistedResumeId()
        const preferredResumeId =
          historyData.resumes.find((item) => item.id === persistedResumeId)?.id ??
          historyData.resumes[0]?.id ??
          null

        if (preferredResumeId !== null) {
          try {
            const response = await fetchResumeDetail(preferredResumeId)
            setActiveResume(response)
            persistActiveResumeId(preferredResumeId)
          } catch {
            setActiveResume(null)
            persistActiveResumeId(null)
          }
        } else {
          persistActiveResumeId(null)
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "工作台初始化失败")
      } finally {
        setIsBootstrapping(false)
      }
    }
    void bootstrap()
  }, [])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setSelectedFile(nextFile)
    setErrorMessage(null)
  }

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedFile) {
      setErrorMessage("请先选择一份 PDF 简历。")
      return
    }
    setIsUploading(true)
    setErrorMessage(null)
    try {
      const response = await uploadResume(selectedFile)
      setActiveResume(response)
      setActiveMatch(null)
      persistActiveResumeId(response.resume_id)
      await refreshWorkspace()
      setSelectedFile(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "简历上传失败")
    } finally {
      setIsUploading(false)
    }
  }

  const handleMatch = async () => {
    if (!activeResume) {
      setErrorMessage("请先选择或上传一份简历。")
      return
    }
    setIsMatching(true)
    setErrorMessage(null)
    try {
      const response = await createMatch(activeResume.resume_id, jdText)
      setActiveMatch(response)
      await refreshWorkspace()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "岗位匹配失败")
    } finally {
      setIsMatching(false)
    }
  }

  const handlePickResume = async (resumeId: number) => {
    try {
      setErrorMessage(null)
      const response = await fetchResumeDetail(resumeId)
      setActiveResume(response)
      setActiveMatch(null)
      persistActiveResumeId(resumeId)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "切换当前简历失败")
    }
  }

  const handleCreateTemplate = async (payload: {
    name: string
    category: string
    content: string
    tags: string[]
  }) => {
    try {
      setErrorMessage(null)
      await createTemplate(payload)
      await refreshWorkspace()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "模板创建失败")
    }
  }

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      setErrorMessage(null)
      await deleteTemplate(templateId)
      await refreshWorkspace()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "模板删除失败")
    }
  }

  const handleUpdateTemplate = async (
    templateId: number,
    payload: Partial<Pick<JDTemplateData, "name" | "category" | "content" | "tags">>
  ) => {
    try {
      setErrorMessage(null)
      await updateTemplate(templateId, payload)
      await refreshWorkspace()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "模板更新失败")
    }
  }

  const handleUpdateResume = async (
    resumeId: number,
    payload: Partial<{
      filename: string
      stage: ResumeUploadData["stage"]
      priority: ResumeUploadData["priority"]
      tags: string[]
      notes: string | null
    }>
  ) => {
    try {
      setErrorMessage(null)
      const response = await updateResume(resumeId, payload)
      setActiveResume((current) => (current?.resume_id === resumeId ? response : current))
      await refreshWorkspace()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "简历信息更新失败")
    }
  }

  const handleDeleteResume = async (resumeId: number) => {
    try {
      setErrorMessage(null)
      await deleteResume(resumeId)
      if (activeResume?.resume_id === resumeId) {
        setActiveResume(null)
        setActiveMatch(null)
        persistActiveResumeId(null)
      }
      await refreshWorkspace()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "简历删除失败")
    }
  }

  return (
    <HashRouter>
      <div className="min-h-svh bg-[#f5f7fa] text-foreground">
        {isBootstrapping ? (
          <div className="flex min-h-svh items-center justify-center px-6">
            <div className="flex items-center gap-3 rounded-xl border border-[#e5e6eb] bg-white px-5 py-4 text-sm text-[#4e5969] shadow-sm">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              正在读取系统数据...
            </div>
          </div>
        ) : (
          <AppShell dashboard={dashboard}>
            <Routes>
              <Route
                element={
                  <OverviewPage
                    activeMatch={activeMatch}
                    activeResume={activeResume}
                    dashboard={dashboard}
                    errorMessage={errorMessage}
                    history={history}
                  />
                }
                path="/"
              />
              <Route
                element={
                  <ResumesPage
                    activeResume={activeResume}
                    errorMessage={errorMessage}
                    history={history}
                    isUploading={isUploading}
                    onFileChange={handleFileChange}
                    onPickResume={(resumeId) => {
                      void handlePickResume(resumeId)
                    }}
                    onRefresh={() => {
                      void refreshWorkspace()
                    }}
                    onUpload={handleUpload}
                    selectedFileName={selectedFile?.name ?? ""}
                  />
                }
                path="/resumes"
              />
              <Route
                element={
                  <MatchingPage
                    activeMatch={activeMatch}
                    activeResume={activeResume}
                    errorMessage={errorMessage}
                    isMatching={isMatching}
                    jdText={jdText}
                    onJdChange={setJdText}
                    onMatch={handleMatch}
                    onPickResume={(resumeId) => {
                      void handlePickResume(resumeId)
                    }}
                    onUseTemplate={(template) => setJdText(template.content)}
                    resumes={history.resumes}
                    templates={templates}
                  />
                }
                path="/matching"
              />
              <Route
                element={
                  <TemplatesPage
                    errorMessage={errorMessage}
                    onCreateTemplate={handleCreateTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                    onUpdateTemplate={handleUpdateTemplate}
                    templates={templates}
                  />
                }
                path="/templates"
              />
              <Route
                element={
                  <HistoryPage
                    history={history}
                    onDeleteResume={handleDeleteResume}
                    onOpenResume={(resumeId) => {
                      void handlePickResume(resumeId)
                    }}
                  />
                }
                path="/history"
              />
              <Route
                element={<ComparePage resumes={history.resumes} templates={templates} />}
                path="/compare"
              />
              <Route
                element={
                  <ResumeDetailPage
                    onActivateResume={(payload) => {
                      setActiveResume(payload)
                      setActiveMatch(null)
                      persistActiveResumeId(payload.resume_id)
                    }}
                    onDeleteResume={handleDeleteResume}
                    onUpdateResume={handleUpdateResume}
                  />
                }
                path="/resumes/:resumeId"
              />
            </Routes>
          </AppShell>
        )}
      </div>
    </HashRouter>
  )
}

export default App
