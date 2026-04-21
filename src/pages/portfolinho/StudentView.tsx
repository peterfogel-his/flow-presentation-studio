import { Link } from 'react-router-dom'
import {
  BookOpen, CheckCircle2, Clock, Circle, ChevronLeft,
  Upload, Users, UserCheck, MessageSquare, Flag,
  ChevronDown, ChevronUp, Lock,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { mockStudentPortfolio } from '@/data/portfolinho-mock'
import type { ActivityType, SubmissionStatus } from '@/types/portfolinho'

const activityConfig: Record<ActivityType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  submission:       { label: 'Inlämning',      icon: Upload,        color: 'text-blue-600',   bg: 'bg-blue-100' },
  peer_review:      { label: 'Peer-review',    icon: Users,         color: 'text-violet-600', bg: 'bg-violet-100' },
  self_assessment:  { label: 'Självvärdering', icon: UserCheck,     color: 'text-amber-600',  bg: 'bg-amber-100' },
  teacher_feedback: { label: 'Lärarrespons',   icon: MessageSquare, color: 'text-emerald-600',bg: 'bg-emerald-100' },
  milestone:        { label: 'Milstolpe',      icon: Flag,          color: 'text-slate-500',  bg: 'bg-slate-100' },
}

const statusConfig: Record<SubmissionStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  not_started: { label: 'Ej påbörjad',  icon: Circle,       color: 'text-slate-400', bg: 'bg-slate-100' },
  in_progress: { label: 'Pågår',        icon: Clock,        color: 'text-blue-600',  bg: 'bg-blue-100' },
  submitted:   { label: 'Inlämnad',     icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-100' },
  reviewed:    { label: 'Återkopplad',  icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const cfg = statusConfig[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

function SubmissionCard({ activityId }: { activityId: string }) {
  const [open, setOpen] = useState(false)
  const portfolio = mockStudentPortfolio
  const submission = portfolio.submissions.find(s => s.activityId === activityId)
  if (!submission) return null

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
      >
        <span className="font-medium text-slate-700">Inlämnad text</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <p className="text-sm text-slate-600 mt-3 whitespace-pre-line leading-relaxed">{submission.content}</p>
          <p className="text-xs text-slate-400 mt-3">Inlämnad {submission.submittedAt}</p>

          {submission.teacherComment && (
            <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-700 mb-1">Lärarens feedback</p>
              <p className="text-sm text-emerald-800">{submission.teacherComment}</p>
            </div>
          )}

          {submission.peerFeedback && submission.peerFeedback.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-slate-500">Peer-feedback du fått</p>
              {submission.peerFeedback.map((pf, i) => (
                <div key={i} className="p-3 rounded-lg bg-violet-50 border border-violet-100">
                  <p className="text-xs font-medium text-violet-700 mb-1">{pf.fromStudent}</p>
                  <p className="text-sm text-violet-800">{pf.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function StudentView() {
  const portfolio = mockStudentPortfolio
  const { student, template, activityStatuses, currentWeek } = portfolio
  const { activities } = template

  const completedCount = Object.values(activityStatuses).filter(
    s => s === 'submitted' || s === 'reviewed'
  ).length
  const progressPercent = Math.round((completedCount / activities.length) * 100)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-2 text-sm text-slate-500">
        <BookOpen className="w-4 h-4" />
        <Link to="/portfolinho" className="hover:text-slate-700">Canvas LMS</Link>
        <span>/</span>
        <span>{template.course}</span>
        <span>/</span>
        <span className="font-medium text-slate-700">Min portfolio</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-500">Vecka {currentWeek} · {template.semester}</span>
          <Link to="/portfolinho">
            <Button variant="ghost" size="sm" className="gap-1 text-slate-500">
              <ChevronLeft className="w-3.5 h-3.5" />
              Tillbaka
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Student header */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Hej, {student.name.split(' ')[0]}!</h1>
              <p className="text-sm text-slate-500 mt-0.5">{template.title} · {template.course}</p>
            </div>
            <StatusBadge status="in_progress" />
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-600">Din progress</span>
              <span className="text-xs text-slate-500">{completedCount} av {activities.length} aktiviteter klara</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Slutportfolio lämnas in senast <span className="font-medium text-slate-600">vecka {activities[activities.length - 1].deadlineWeek}</span>
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[22px] top-6 bottom-6 w-0.5 bg-slate-200" />

          <div className="space-y-2">
            {activities.map((activity, index) => {
              const status = activityStatuses[activity.id] || 'not_started'
              const cfg = activityConfig[activity.type]
              const statusCfg = statusConfig[status]
              const Icon = cfg.icon
              const StatusIcon = statusCfg.icon
              const isActive = status === 'in_progress'
              const isDone = status === 'submitted' || status === 'reviewed'
              const isLocked = status === 'not_started' && index > 0 && activityStatuses[activities[index - 1]?.id] === 'not_started'
              const isPast = status === 'reviewed'

              return (
                <div key={activity.id} className={`relative pl-12 ${isActive ? 'z-10' : ''}`}>
                  {/* Node */}
                  <div className={`absolute left-0 top-3 flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all ${
                    isDone
                      ? 'bg-emerald-50 border-emerald-300'
                      : isActive
                      ? 'bg-indigo-50 border-indigo-400 ring-4 ring-indigo-100'
                      : 'bg-white border-slate-200'
                  }`}>
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4 text-slate-300" />
                    ) : (
                      <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                    )}
                  </div>

                  {/* Card */}
                  <div className={`rounded-xl border p-4 transition-all ${
                    isActive
                      ? 'bg-white border-indigo-200 shadow-sm shadow-indigo-100'
                      : isPast
                      ? 'bg-white border-slate-100'
                      : isLocked
                      ? 'bg-slate-50 border-slate-100 opacity-60'
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-xs text-slate-300">·</span>
                          <span className="text-xs text-slate-400">
                            {isDone ? `Klar v.${activity.deadlineWeek}` : `Deadline v.${activity.deadlineWeek}`}
                          </span>
                        </div>
                        <h3 className={`font-semibold text-sm leading-snug ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
                          {activity.title}
                        </h3>
                        {!isLocked && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{activity.description}</p>
                        )}
                        {isLocked && (
                          <p className="text-xs text-slate-400 mt-1">Låst tills föregående aktivitet är klar</p>
                        )}
                      </div>
                      <StatusBadge status={status} />
                    </div>

                    {/* Action button for active */}
                    {isActive && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          Öppnad v.{activity.opensWeek} · Deadline v.{activity.deadlineWeek}
                        </span>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs h-7 px-3">
                          Gå till uppgift →
                        </Button>
                      </div>
                    )}

                    {/* Submitted content */}
                    {(status === 'submitted' || status === 'reviewed') && (
                      <SubmissionCard activityId={activity.id} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-8 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
          <p className="text-sm text-indigo-700 font-medium mb-1">Om din portfolio</p>
          <p className="text-xs text-indigo-600 leading-relaxed">
            Din portfolio bedöms i sin helhet när du lämnar in slutportfolion. Varje aktivitet bygger på din kompetens och utgör bevis mot bedömningsmatrisen. Det slutliga betyget sätts mot hela portfolion — inte enskilda inlämningar.
          </p>
        </div>
      </div>
    </div>
  )
}
