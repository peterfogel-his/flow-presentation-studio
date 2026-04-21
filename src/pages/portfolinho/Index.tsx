import { Link } from 'react-router-dom'
import { LayoutList, User, ClipboardCheck, BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const views = [
  {
    to: '/portfolinho/teacher',
    icon: LayoutList,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    badge: 'Lärare',
    badgeClass: 'bg-indigo-100 text-indigo-700',
    title: 'Malldesign',
    description: 'Bygg aktivitetssekvensen för kursen. Koppla aktiviteter till bedömningskriterier och ange deadlines.',
    cta: 'Öppna malldesign',
  },
  {
    to: '/portfolinho/student',
    icon: User,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    badge: 'Student',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    title: 'Min portfolio',
    description: 'Följ din progress längs aktivitetssekvensen. Se inlämnade arbeten, feedback och kommande uppgifter.',
    cta: 'Öppna studentvy',
  },
  {
    to: '/portfolinho/assess',
    icon: ClipboardCheck,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    badge: 'Lärare',
    badgeClass: 'bg-violet-100 text-violet-700',
    title: 'Bedömning',
    description: 'Granska studentens hela portfolio och sätt betyg direkt mot bedömningsmatrisen. Skicka till Canvas.',
    cta: 'Öppna bedömningsvy',
  },
]

export default function PortfolioIndex() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Canvas-style top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-2 text-sm text-slate-500">
        <BookOpen className="w-4 h-4" />
        <span>Canvas LMS</span>
        <span>/</span>
        <span>Vetenskaplig kommunikation 7.5 hp</span>
        <span>/</span>
        <span className="font-medium text-slate-700">Portfolinho</span>
        <div className="ml-auto flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Ansluten till Canvas
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-5">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Portfolinho</h1>
          <p className="text-slate-500 text-lg">
            Portfolio-verktyg för Canvas LMS — strukturerade aktivitetssekvenser som bygger studentens portfolio steg för steg.
          </p>
          <div className="mt-4 text-sm text-slate-400">
            Kurs: <span className="font-medium text-slate-600">Vetenskaplig kommunikation 7.5 hp</span>
            {' · '}
            Mall: <span className="font-medium text-slate-600">Argumenterande portfolio</span>
            {' · '}
            VT 2026
          </div>
        </div>

        {/* View cards */}
        <div className="grid gap-4">
          {views.map((v) => (
            <Card key={v.to} className={`border ${v.border} hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${v.bg} mt-0.5`}>
                    <v.icon className={`w-5 h-5 ${v.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base">{v.title}</CardTitle>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${v.badgeClass}`}>
                        {v.badge}
                      </span>
                    </div>
                    <CardDescription>{v.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pl-16">
                <Link to={v.to}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    {v.cta}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-10">
          POC — Portfolinho · LTI 1.3 · Canvas Integration
        </p>
      </div>
    </div>
  )
}
