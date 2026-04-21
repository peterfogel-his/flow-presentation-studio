import { Link } from 'react-router-dom'
import {
  BookOpen, CheckCircle2, Plus, GripVertical,
  Upload, Users, UserCheck, MessageSquare, Flag,
  Info, ChevronLeft, Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { mockTemplate } from '@/data/portfolinho-mock'
import type { Activity, ActivityType, AssessmentType } from '@/types/portfolinho'

const activityConfig: Record<ActivityType, { label: string; icon: React.ElementType; bg: string; text: string; border: string }> = {
  submission:       { label: 'Inlämning',      icon: Upload,       bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200' },
  peer_review:      { label: 'Peer-review',    icon: Users,        bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
  self_assessment:  { label: 'Självvärdering', icon: UserCheck,    bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200' },
  teacher_feedback: { label: 'Lärarrespons',   icon: MessageSquare,bg: 'bg-emerald-100',text: 'text-emerald-700',border: 'border-emerald-200' },
  milestone:        { label: 'Milstolpe',      icon: Flag,         bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-200' },
}

const assessmentConfig: Record<AssessmentType, { label: string; className: string }> = {
  none:            { label: '—',      className: 'text-slate-400' },
  pass_fail:       { label: 'G / U',  className: 'bg-amber-100 text-amber-700 border-amber-200' },
  rubric_criteria: { label: 'Matris', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
}

function ActivityTypeBadge({ type }: { type: ActivityType }) {
  const cfg = activityConfig[type]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

function CriterionChip({ criterionId }: { criterionId: string }) {
  const criterion = mockTemplate.rubric.criteria.find(c => c.id === criterionId)
  if (!criterion) return null
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600 border border-slate-200">
      {criterion.title}
    </span>
  )
}

function ActivityRow({ activity, isLast }: { activity: Activity; isLast: boolean }) {
  const assessCfg = assessmentConfig[activity.assessmentType]
  const hasPeerRubric = !!activity.peerRubricId

  return (
    <tr className={`group hover:bg-slate-50 transition-colors ${!isLast ? 'border-b border-slate-100' : ''}`}>
      {/* Drag handle + position */}
      <td className="w-10 pl-3 pr-1 py-3">
        <div className="flex items-center gap-1">
          <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400 cursor-grab" />
          <span className="text-xs font-mono text-slate-400">{activity.position}</span>
        </div>
      </td>

      {/* Type + title */}
      <td className="py-3 pr-4 min-w-0">
        <div className="flex flex-col gap-1">
          <ActivityTypeBadge type={activity.type} />
          <span className="font-medium text-slate-800 text-sm leading-snug">{activity.title}</span>
          <span className="text-xs text-slate-400 leading-snug line-clamp-2">{activity.description}</span>
        </div>
      </td>

      {/* Opens week */}
      <td className="py-3 pr-4 whitespace-nowrap">
        <span className="text-sm text-slate-600">v.{activity.opensWeek}</span>
      </td>

      {/* Deadline */}
      <td className="py-3 pr-4 whitespace-nowrap">
        <span className="text-sm font-medium text-slate-700">v.{activity.deadlineWeek}</span>
      </td>

      {/* Assessment */}
      <td className="py-3 pr-4 whitespace-nowrap">
        {activity.assessmentType === 'none' ? (
          <span className="text-sm text-slate-400">—</span>
        ) : (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${assessCfg.className}`}>
            {assessCfg.label}
          </span>
        )}
      </td>

      {/* Criteria */}
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-1">
          {activity.criteriaIds.length === 0 && (
            <span className="text-xs text-slate-300">—</span>
          )}
          {activity.criteriaIds.map(id => (
            <CriterionChip key={id} criterionId={id} />
          ))}
        </div>
      </td>

      {/* Peer rubric indicator */}
      <td className="py-3 pr-4">
        {hasPeerRubric ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-violet-50 text-violet-600 border border-violet-100">
            <Users className="w-3 h-3" />
            Stödmatris
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>

      {/* Notes */}
      <td className="py-3 pr-3">
        {activity.notes ? (
          <div className="group/note relative inline-block">
            <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
            <div className="absolute right-0 bottom-6 w-56 bg-slate-800 text-white text-xs rounded-lg p-2.5 hidden group-hover/note:block z-10 shadow-lg">
              {activity.notes}
            </div>
          </div>
        ) : null}
      </td>
    </tr>
  )
}

function RubricSummary() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Bedömningsmatris (Canvas)</h3>
          <p className="text-xs text-slate-400 mt-0.5">{mockTemplate.rubric.title}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-medium">
          Synkad
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {mockTemplate.rubric.criteria.map(c => (
          <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
            <span className="text-xs font-medium text-slate-700">{c.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TemplateEditor() {
  const { title, course, semester, activities } = mockTemplate

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-2 text-sm text-slate-500">
        <BookOpen className="w-4 h-4" />
        <Link to="/portfolinho" className="hover:text-slate-700">Canvas LMS</Link>
        <span>/</span>
        <span>{course}</span>
        <span>/</span>
        <span className="font-medium text-slate-700">Portfolinho</span>
        <span>/</span>
        <span className="text-slate-700">Malldesign</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Synkad med Canvas
          </span>
          <Link to="/portfolinho">
            <Button variant="ghost" size="sm" className="gap-1 text-slate-500">
              <ChevronLeft className="w-3.5 h-3.5" />
              Tillbaka
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{course} · {semester}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings2 className="w-4 h-4" />
              Inställningar
            </Button>
            <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4" />
              Lägg till aktivitet
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_280px] gap-6">
          {/* Activity table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-700 text-sm">Aktivitetssekvens</h2>
              <span className="text-xs text-slate-400">{activities.length} aktiviteter</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="w-10 pl-3 pr-1 py-2.5 text-left" />
                    <th className="py-2.5 pr-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Aktivitet</th>
                    <th className="py-2.5 pr-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Öppnar</th>
                    <th className="py-2.5 pr-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Deadline</th>
                    <th className="py-2.5 pr-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Bedömning</th>
                    <th className="py-2.5 pr-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Kriterier</th>
                    <th className="py-2.5 pr-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Peer-stöd</th>
                    <th className="py-2.5 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Not</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, i) => (
                    <ActivityRow
                      key={activity.id}
                      activity={activity}
                      isLast={i === activities.length - 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add row hint */}
            <div className="px-5 py-3 border-t border-dashed border-slate-200">
              <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-600 transition-colors">
                <Plus className="w-4 h-4" />
                Lägg till aktivitet
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            <RubricSummary />

            {/* Legend */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-800 text-sm mb-3">Aktivitetstyper</h3>
              <div className="flex flex-col gap-2">
                {(Object.entries(activityConfig) as [ActivityType, typeof activityConfig[ActivityType]][]).map(([type, cfg]) => {
                  const Icon = cfg.icon
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${cfg.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
                      </span>
                      <span className="text-xs text-slate-600">{cfg.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Student count */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-800 text-sm mb-1">Kursdeltagare</h3>
              <p className="text-2xl font-bold text-slate-900 mt-1">5</p>
              <p className="text-xs text-slate-400">studenter aktiva i portfolion</p>
              <Link to="/portfolinho/assess">
                <Button variant="outline" size="sm" className="mt-3 w-full text-xs gap-1">
                  Gå till bedömning
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
