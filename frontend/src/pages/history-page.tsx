import { useDeferredValue, useMemo, useState } from "react"
import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { compactHash, formatDate } from "@/lib/format"
import type { HistoryPayload, ResumePriority, ResumeStage } from "@/types/api"

type HistoryPageProps = {
  history: HistoryPayload
  onOpenResume: (resumeId: number) => void
  onDeleteResume: (resumeId: number) => Promise<void>
}

const stageLabelMap: Record<ResumeStage, string> = {
  new: "新入库",
  screening: "筛选中",
  interview: "面试中",
  offer: "待发 Offer",
  rejected: "已淘汰",
}

const priorityLabelMap: Record<ResumePriority, string> = {
  low: "低",
  medium: "中",
  high: "高",
}

export function HistoryPage({ history, onOpenResume, onDeleteResume }: HistoryPageProps) {
  const [searchValue, setSearchValue] = useState("")
  const [stageFilter, setStageFilter] = useState<ResumeStage | "">("")
  const [priorityFilter, setPriorityFilter] = useState<ResumePriority | "">("")
  const deferredSearch = useDeferredValue(searchValue)
  const normalizedSearch = deferredSearch.trim().toLowerCase()

  const filteredResumes = useMemo(
    () =>
      history.resumes.filter((item) => {
        const matchesKeyword =
          !normalizedSearch ||
          item.filename.toLowerCase().includes(normalizedSearch) ||
          (item.profile.name || "").toLowerCase().includes(normalizedSearch) ||
          (item.profile.job_intention || "").toLowerCase().includes(normalizedSearch) ||
          item.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))
        const matchesStage = !stageFilter || item.stage === stageFilter
        const matchesPriority = !priorityFilter || item.priority === priorityFilter
        return matchesKeyword && matchesStage && matchesPriority
      }),
    [history.resumes, normalizedSearch, priorityFilter, stageFilter]
  )

  const filteredMatches = useMemo(
    () =>
      history.matches.filter((item) => {
        if (!normalizedSearch) return true
        return (
          item.resume_filename.toLowerCase().includes(normalizedSearch) ||
          item.jd_excerpt.toLowerCase().includes(normalizedSearch) ||
          item.recommendation.toLowerCase().includes(normalizedSearch) ||
          item.next_action.toLowerCase().includes(normalizedSearch)
        )
      }),
    [history.matches, normalizedSearch]
  )

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>简历记录</CardDescription>
            <CardTitle className="text-2xl text-[#1d2129]">{history.resumes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#e5e6eb] shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>匹配记录</CardDescription>
            <CardTitle className="text-2xl text-[#1d2129]">{history.matches.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#e5e6eb] shadow-none md:col-span-2">
          <CardHeader className="pb-2">
            <CardDescription>组合筛选</CardDescription>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_120px]">
              <Input
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="搜索姓名、文件名、求职意向、标签、JD"
                value={searchValue}
              />
              <select
                className="h-10 rounded-md border border-[#d9dde4] bg-white px-3 text-sm text-[#1d2129]"
                onChange={(event) => setStageFilter(event.target.value as ResumeStage | "")}
                value={stageFilter}
              >
                <option value="">全部阶段</option>
                {Object.entries(stageLabelMap).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-[#d9dde4] bg-white px-3 text-sm text-[#1d2129]"
                onChange={(event) => setPriorityFilter(event.target.value as ResumePriority | "")}
                value={priorityFilter}
              >
                <option value="">全部优先级</option>
                {Object.entries(priorityLabelMap).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-[#e5e6eb] shadow-none">
        <CardHeader>
          <CardTitle className="text-lg text-[#1d2129]">简历记录</CardTitle>
          <CardDescription>查看上传历史、候选人信息与管理状态</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>文件名</TableHead>
                <TableHead>候选人</TableHead>
                <TableHead>阶段 / 优先级</TableHead>
                <TableHead>最近匹配</TableHead>
                <TableHead>Hash</TableHead>
                <TableHead>上传时间</TableHead>
                <TableHead className="w-[220px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResumes.length ? (
                filteredResumes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-[#1d2129]">{item.filename}</TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <span className="text-sm text-[#1d2129]">{item.profile.name || "未识别"}</span>
                        <span className="text-xs text-[#86909c]">
                          {item.profile.job_intention || "暂无求职意向"}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <Badge variant="outline">{stageLabelMap[item.stage]}</Badge>
                        <Badge variant={item.priority === "high" ? "warning" : "secondary"}>
                          {priorityLabelMap[item.priority]}优先级
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <span className="text-sm text-[#1d2129]">
                          {item.latest_match_score !== null ? `${item.latest_match_score} 分` : "暂无"}
                        </span>
                        <span className="text-xs text-[#86909c]">
                          {item.latest_recommendation || "暂无推荐结论"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#4e5969]">{compactHash(item.text_hash)}</TableCell>
                    <TableCell className="text-[#4e5969]">{formatDate(item.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => onOpenResume(item.id)} size="sm" type="button">
                          设为当前
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/resumes/${item.id}`}>详情</Link>
                        </Button>
                        <Button
                          onClick={() => void onDeleteResume(item.id)}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="py-10 text-center text-[#86909c]" colSpan={7}>
                    暂无符合条件的简历记录
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-[#e5e6eb] shadow-none">
        <CardHeader>
          <CardTitle className="text-lg text-[#1d2129]">匹配记录</CardTitle>
          <CardDescription>查看岗位匹配结果、风险等级与建议动作</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>简历文件</TableHead>
                <TableHead>评分</TableHead>
                <TableHead>推荐结论</TableHead>
                <TableHead>风险等级</TableHead>
                <TableHead>下一步动作</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatches.length ? (
                filteredMatches.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-[#1d2129]">{item.resume_filename}</TableCell>
                    <TableCell className="font-semibold text-[#1d2129]">{item.score}</TableCell>
                    <TableCell className="max-w-[220px] text-[#4e5969]">
                      {item.recommendation}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.risk_level === "high" ? "warning" : "outline"}>
                        {item.risk_level}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[280px] text-[#4e5969]">{item.next_action}</TableCell>
                    <TableCell className="text-[#4e5969]">{formatDate(item.created_at)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="py-10 text-center text-[#86909c]" colSpan={6}>
                    暂无符合条件的匹配记录
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
