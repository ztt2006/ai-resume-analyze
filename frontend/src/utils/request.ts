import axios from "axios"

import type {
  ApiEnvelope,
  CompareMatchResponseData,
  DashboardOverview,
  HistoryPayload,
  JDTemplateData,
  MatchResponseData,
  ResumeDetailData,
  ResumeHistoryItem,
  ResumePriority,
  ResumeStage,
  ResumeUploadData,
} from "@/types/api"

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api",
  timeout: 60000,
})

apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiEnvelope<unknown>
    if (payload && typeof payload.code === "number") {
      if (payload.code !== 0) {
        return Promise.reject(new Error(payload.message || "请求失败"))
      }
      return payload.data
    }
    return response.data
  },
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "网络连接异常，请检查后端服务是否启动"
    return Promise.reject(new Error(message))
  }
)

export async function uploadResume(file: File): Promise<ResumeUploadData> {
  const formData = new FormData()
  formData.append("file", file)
  return apiClient.post("/resumes/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }) as Promise<ResumeUploadData>
}

export async function createMatch(
  resumeId: number,
  jdText: string
): Promise<MatchResponseData> {
  return apiClient.post("/matches", {
    resume_id: resumeId,
    jd_text: jdText,
  }) as Promise<MatchResponseData>
}

export async function fetchHistory(): Promise<HistoryPayload> {
  return apiClient.get("/history") as Promise<HistoryPayload>
}

export async function fetchResumes(params?: {
  keyword?: string
  stage?: ResumeStage | ""
  priority?: ResumePriority | ""
}): Promise<{
  total: number
  items: ResumeHistoryItem[]
}> {
  return apiClient.get("/resumes", {
    params: {
      q: params?.keyword || undefined,
      stage: params?.stage || undefined,
      priority: params?.priority || undefined,
    },
  }) as Promise<{
    total: number
    items: ResumeHistoryItem[]
  }>
}

export async function fetchResumeDetail(resumeId: number): Promise<ResumeDetailData> {
  return apiClient.get(`/resumes/${resumeId}`) as Promise<ResumeDetailData>
}

export function getResumePreviewUrl(resumeId: number): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api"
  return `${baseUrl}/resumes/${resumeId}/preview`
}

export async function updateResume(
  resumeId: number,
  payload: Partial<{
    filename: string
    stage: ResumeStage
    priority: ResumePriority
    tags: string[]
    notes: string | null
  }>
): Promise<ResumeUploadData> {
  return apiClient.patch(`/resumes/${resumeId}`, payload) as Promise<ResumeUploadData>
}

export async function deleteResume(resumeId: number): Promise<{ id: number }> {
  return apiClient.delete(`/resumes/${resumeId}`) as Promise<{ id: number }>
}

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  return apiClient.get("/dashboard/overview") as Promise<DashboardOverview>
}

export async function fetchTemplates(): Promise<JDTemplateData[]> {
  return apiClient.get("/jd-templates") as Promise<JDTemplateData[]>
}

export async function createTemplate(payload: {
  name: string
  category: string
  content: string
  tags: string[]
}): Promise<JDTemplateData> {
  return apiClient.post("/jd-templates", payload) as Promise<JDTemplateData>
}

export async function updateTemplate(
  templateId: number,
  payload: Partial<Pick<JDTemplateData, "name" | "category" | "content" | "tags">>
): Promise<JDTemplateData> {
  return apiClient.patch(`/jd-templates/${templateId}`, payload) as Promise<JDTemplateData>
}

export async function deleteTemplate(templateId: number): Promise<{ id: number }> {
  return apiClient.delete(`/jd-templates/${templateId}`) as Promise<{ id: number }>
}

export async function compareResumes(payload: {
  resume_ids: number[]
  jd_text?: string
  template_id?: number
}): Promise<CompareMatchResponseData> {
  return apiClient.post("/matches/compare", payload) as Promise<CompareMatchResponseData>
}
