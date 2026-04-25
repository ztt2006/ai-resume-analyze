export type ApiEnvelope<T> = {
  code: number
  data: T
  message: string
}

export type CandidateProfile = {
  name: string | null
  phone: string | null
  email: string | null
  address: string | null
  education_background: string[]
  years_of_experience: string | null
  project_experience: string[]
  job_intention: string | null
  expected_salary: string | null
  strengths: string[]
}

export type ResumeStage = "new" | "screening" | "interview" | "offer" | "rejected"
export type ResumePriority = "low" | "medium" | "high"

export type ResumeUploadData = {
  resume_id: number
  filename: string
  text_hash: string
  page_count: number
  raw_text: string
  cleaned_text: string
  has_preview_file: boolean
  profile: CandidateProfile
  cache_hit: boolean
  duplicate: boolean
  ai_provider: string
  stage: ResumeStage
  priority: ResumePriority
  tags: string[]
  notes: string | null
  latest_match_score: number | null
  latest_recommendation: string | null
  latest_risk_level: string | null
  latest_next_action: string | null
  created_at: string
}

export type ResumeHistoryItem = {
  id: number
  filename: string
  text_hash: string
  page_count: number
  has_preview_file: boolean
  profile: CandidateProfile
  match_count: number
  stage: ResumeStage
  priority: ResumePriority
  tags: string[]
  notes: string | null
  latest_match_score: number | null
  latest_recommendation: string | null
  latest_risk_level: string | null
  latest_next_action: string | null
  created_at: string
}

export type MatchDimension = {
  score: number
  matched: string[]
  missing: string[]
}

export type JDAnalysis = {
  core_skills: string[]
  qualification_keywords: string[]
  seniority_requirement: string | null
  education_requirement: string | null
}

export type MatchInsight = {
  jd_analysis: JDAnalysis
  skill_dimension: MatchDimension
  experience_dimension: MatchDimension
  education_dimension: MatchDimension
  summary: string[]
  strengths: string[]
  risks: string[]
  recommendation: string
  risk_level: string
  next_action: string
  interview_questions: string[]
  recommendation_reasons: string[]
}

export type MatchResponseData = {
  match_id: number
  resume_id: number
  jd_hash: string
  jd_text: string
  score: number
  detail: MatchInsight
  cache_hit: boolean
  duplicate: boolean
  created_at: string
}

export type MatchHistoryItem = {
  id: number
  resume_id: number
  resume_filename: string
  score: number
  jd_excerpt: string
  strengths: string[]
  recommendation: string
  risk_level: string
  next_action: string
  created_at: string
}

export type HistoryPayload = {
  resumes: ResumeHistoryItem[]
  matches: MatchHistoryItem[]
}

export type ResumeMatchPreview = {
  id: number
  score: number
  jd_excerpt: string
  recommendation: string
  risk_level: string
  next_action: string
  interview_questions: string[]
  created_at: string
}

export type ResumeDetailData = ResumeUploadData & {
  recent_matches: ResumeMatchPreview[]
}

export type DashboardTopCandidate = {
  resume_id: number
  filename: string
  candidate_name: string | null
  stage: ResumeStage
  priority: ResumePriority
  latest_score: number
  latest_recommendation: string | null
}

export type DashboardPendingAction = {
  resume_id: number
  filename: string
  candidate_name: string | null
  stage: ResumeStage
  risk_level: string
  next_action: string
  created_at: string
}

export type DashboardOverview = {
  total_resumes: number
  total_matches: number
  average_score: number
  highest_score: number
  cache_backend: string
  score_distribution: Record<string, number>
  stage_distribution: Record<string, number>
  recommendation_distribution: Record<string, number>
  recent_resume_names: string[]
  recent_match_scores: number[]
  top_candidates: DashboardTopCandidate[]
  pending_actions: DashboardPendingAction[]
  generated_at: string
}

export type JDTemplateData = {
  id: number
  name: string
  category: string
  content: string
  tags: string[]
  created_at: string
}

export type CandidateComparisonItem = {
  resume_id: number
  resume_filename: string
  candidate_name: string | null
  score: number
  recommendation: string
  risk_level: string
  next_action: string
  strengths: string[]
  risks: string[]
  skill_dimension: MatchDimension
  experience_dimension: MatchDimension
  education_dimension: MatchDimension
}

export type CompareMatchResponseData = {
  jd_text: string
  total_candidates: number
  average_score: number
  recommended_count: number
  high_risk_count: number
  top_candidate_name: string | null
  ranking: CandidateComparisonItem[]
}
