import { Link } from 'react-router-dom'
import { useState } from 'react'
import {
  BookOpen, ChevronLeft, Upload, Users, UserCheck,
  CheckCircle2, Send, ChevronDown, ChevronUp, User,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mockStudentPortfolio, mockStudentList } from '@/data/portfolinho-mock'
import type { ActivityType, RubricCriterion } from '@/types/portfolinho'

const activityConfig: Record<ActivityType, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  submission:       { label: 'Inlämning',      icon: Upload,    color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-100' },
  peer_review:      { label: 'Peer-review',    icon: Users,     color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-100' },
  self_assessment:  { label: 'Självvärdering', icon: UserCheck, color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-100' },
  teacher_feedback: { label: 'Lärarrespons',   icon: Upload,    color: 'text-emerald-700',bg: 'bg-emerald-50',border: 'border-emerald-100' },
  milestone:        { label: 'Milstolpe',      icon: Upload,    color: 'text-slate-600',  bg: 'bg-slate-50',  border: 'border-slate-100' },
}

const levelColors = [
  { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    selected: 'bg-red-500 border-red-500 text-white' },
  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  selected: 'bg-amber-500 border-amber-500 text-white' },
  { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   selected: 'bg-blue-500 border-blue-500 text-white' },
  { bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-700',selected: 'bg-emerald-500 border-emerald-500 text-white' },
]

function gradeFromScores(scores: Record<string, number>, maxPerCriterion: number, criteriaCount: number): string {
  const total = Object.values(scores).reduce((s, v) => s + v, 0)
  const max = maxPerCriterion * criteriaCount
  if (max === 0) return '—'
  const pct = total / max
  if (pct >= 0.90) return 'A'
  if (pct >= 0.78) return 'B'
  if (pct >= 0.65) return 'C'
  if (pct >= 0.52) return 'D'
  if (pct >= 0.40) return 'E'
  return 'F'
}

function gradeColor(grade: string) {
  if (grade === 'A') return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (grade === 'B') return 'text-blue-600 bg-blue-50 border-blue-200'
  if (grade === 'C') return 'text-indigo-600 bg-indigo-50 border-indigo-200'
  if (grade === 'D') return 'text-amber-600 bg-amber-50 border-amber-200'
  if (grade === 'E') return 'text-orange-600 bg-orange-50 border-orange-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

function CriterionScorer({
  criterion,
  value,
  onChange,
}: {
  criterion: RubricCriterion
  value: number | undefined
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2">
        <span className="font-semibold text-sm text-slate-800">{criterion.title}</span>
        <span className="text-xs text-slate-400 ml-2">{criterion.description}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {criterion.ratings.map((rating) => {
          const colors = levelColors[rating.points]
          const isSelected = value === rating.points
          return (
            <button
              key={rating.points}
              onClick={() => onChange(rating.points)}
              className={`group flex flex-col p-2.5 rounded-lg border text-left transition-all hover:shadow-sm ${
                isSelected ? colors.selected : `${colors.bg} ${colors.border} ${colors.text} hover:border-opacity-70`
              }`}
            >
              <span className={`text-xs font-bold mb-0.5 ${isSelected ? 'text-white' : ''}`}>
                {rating.points}p
              </span>
              <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-white' : ''}`}>
                {rating.label}
              </span>
              <span className={`text-xs mt-1 leading-tight opacity-80 hidden group-hover:block ${isSelected ? 'text-white !block' : ''}`}>
                {rating.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PortfolioEntry({ activityId }: { activityId: string }) {
  const [open, setOpen] = useState(true)
  const portfolio = mockStudentPortfolio
  const activity = portfolio.template.activities.find(a => a.id === activityId)
  const submission = portfolio.submissions.find(s => s.activityId === activityId)
  if (!activity || !submission) return null

  const cfg = activityConfig[activity.type]
  const Icon = cfg.icon

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b ${open ? 'border-slate-100' : 'border-transparent'}`}
      >
        <div className={`p-1.5 rounded-lg ${cfg.bg} ${cfg.border} border`}>
          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
        </div>
        <div className="flex-1 text-left">
          <span className="text-sm font-semibold text-slate-800">{activity.title}</span>
          <span className="text-xs text-slate-400 ml-2">Inlämnad {submission.submittedAt}</span>
        </div>
        <div className="flex items-center gap-2">
          {activity.criteriaIds.length > 0 && (
            <div className="flex gap-1">
              {activity.criteriaIds.map(id => {
                const c = portfolio.template.rubric.criteria.find(rc => rc.id === id)
                return c ? (
                  <span key={id} className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {c.title}
                  </span>
                ) : null
              })}
            </div>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 py-4">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{submission.content}</p>

          {submission.teacherComment && (
            <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-700 mb-1">Din feedback (lämnad)</p>
              <p className="text-sm text-emerald-800">{submission.teacherComment}</p>
            </div>
          )}

          {submission.peerFeedback && submission.peerFeedback.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-slate-500 mb-1">Peer-feedback studenten fått</p>
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

export default function AssessmentView() {
  const portfolio = mockStudentPortfolio
  const { rubric } = portfolio.template
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('stu-1')

  const scoredCount = Object.keys(scores).length
  const allScored = scoredCount === rubric.criteria.length
  const grade = gradeFromScores(scores, 3, rubric.criteria.length)
  const totalPoints = Object.values(scores).reduce((s, v) => s + v, 0)
  const maxPoints = rubric.criteria.length * 3

  const submittedActivities = portfolio.template.activities.filter(
    a => portfolio.activityStatuses[a.id] === 'submitted' || portfolio.activityStatuses[a.id] === 'reviewed'
  )

  function handleSubmit() {
    if (!allScored) return
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-2 text-sm text-slate-500">
        <BookOpen className="w-4 h-4" />
        <Link to="/portfolinho" className="hover:text-slate-700">Canvas LMS</Link>
        <span>/</span>
        <span>{portfolio.template.course}</span>
        <span>/</span>
        <span className="font-medium text-slate-700">Bedömning</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-500">{portfolio.template.semester}</span>
          <Link to="/portfolinho">
            <Button variant="ghost" size="sm" className="gap-1 text-slate-500">
              <ChevronLeft className="w-3.5 h-3.5" />
              Tillbaka
            </Button>
          </Link>
        </div>
      </div>

      {/* Student selector bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-2.5 flex items-center gap-3">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Student</span>
        <div className="flex gap-2 flex-wrap">
          {mockStudentList.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedStudentId(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                selectedStudentId === s.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <User className="w-3 h-3" />
              {s.name}
              <span className={`text-xs ${selectedStudentId === s.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                {s.progress}/{s.total}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex h-[calc(100vh-105px)]">
        {/* LEFT: Portfolio */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">{portfolio.student.name}</h2>
                <p className="text-xs text-slate-400">{portfolio.student.email}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-slate-400">Inlämnade aktiviteter</p>
                <p className="text-sm font-semibold text-slate-700">{submittedActivities.length} av {portfolio.template.activities.length}</p>
              </div>
            </div>

            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                <span className="font-semibold">Aktivitet 6 (Slutportfolio)</span> ej inlämnad ännu (deadline v.13). Du bedömer portfolion i sin helhet när den är komplett.
              </p>
            </div>

            {submittedActivities.map(activity => (
              <PortfolioEntry key={activity.id} activityId={activity.id} />
            ))}
          </div>
        </div>

        {/* RIGHT: Rubric panel */}
        <div className="w-[380px] flex-shrink-0 border-l border-slate-200 bg-white overflow-y-auto">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">Bedömningsmatris</h2>
            <p className="text-xs text-slate-400 mt-0.5">{rubric.title}</p>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Skickat till Canvas!</p>
                <p className="text-xs text-slate-500 mt-1">
                  Betyg <span className="font-bold">{grade}</span> och kriteriepoäng har registrerats i gradebook.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSubmitted(false); setScores({}); setComment('') }}
                className="mt-2 text-xs"
              >
                Återställ
              </Button>
            </div>
          ) : (
            <div className="px-5 py-5">
              {/* Criteria scoring */}
              {rubric.criteria.map(criterion => (
                <CriterionScorer
                  key={criterion.id}
                  criterion={criterion}
                  value={scores[criterion.id]}
                  onChange={v => setScores(prev => ({ ...prev, [criterion.id]: v }))}
                />
              ))}

              {/* Score summary */}
              <div className="mt-4 mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Poäng</p>
                  <p className="text-lg font-bold text-slate-800">
                    {totalPoints} / {maxPoints}
                  </p>
                  <p className="text-xs text-slate-400">{scoredCount}/{rubric.criteria.length} kriterier bedömda</p>
                </div>
                <div className={`text-center px-4 py-2 rounded-lg border font-bold text-2xl ${allScored ? gradeColor(grade) : 'text-slate-300 bg-slate-50 border-slate-200'}`}>
                  {allScored ? grade : '—'}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sammanfattande kommentar
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Beskriv din samlade bedömning av portfolion..."
                  rows={4}
                  className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder:text-slate-300"
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={!allScored}
                className={`w-full gap-2 ${allScored ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
              >
                <Send className="w-4 h-4" />
                Skicka till Canvas gradebook
              </Button>
              {!allScored && (
                <p className="text-xs text-center text-slate-400 mt-2">
                  Bedöm alla {rubric.criteria.length} kriterier för att skicka
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
