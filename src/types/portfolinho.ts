export type ActivityType =
  | 'submission'
  | 'peer_review'
  | 'self_assessment'
  | 'teacher_feedback'
  | 'milestone'

export type AssessmentType = 'none' | 'pass_fail' | 'rubric_criteria'

export type SubmissionStatus = 'not_started' | 'in_progress' | 'submitted' | 'reviewed'

export interface RubricRating {
  points: number
  label: string
  description: string
}

export interface RubricCriterion {
  id: string
  title: string
  description: string
  ratings: RubricRating[]
}

export interface Rubric {
  id: string
  title: string
  source: 'canvas' | 'portfolinho'
  criteria: RubricCriterion[]
}

export interface PeerRubric {
  id: string
  title: string
  questions: { id: string; question: string }[]
}

export interface Activity {
  id: string
  position: number
  title: string
  type: ActivityType
  description: string
  opensWeek: number
  deadlineWeek: number
  assessmentType: AssessmentType
  criteriaIds: string[]
  peerRubricId?: string
  notes: string
}

export interface PortfolioTemplate {
  id: string
  title: string
  course: string
  semester: string
  activities: Activity[]
  rubric: Rubric
  peerRubrics: PeerRubric[]
}

export interface PeerFeedback {
  fromStudent: string
  comment: string
  responses?: Record<string, string>
  submittedAt: string
}

export interface Submission {
  id: string
  activityId: string
  content: string
  submittedAt: string
  teacherComment?: string
  peerFeedback?: PeerFeedback[]
}

export interface StudentPortfolio {
  id: string
  student: { id: string; name: string; email: string }
  template: PortfolioTemplate
  submissions: Submission[]
  activityStatuses: Record<string, SubmissionStatus>
  currentWeek: number
  assessment?: {
    criteriaScores: Record<string, number>
    comment: string
    finalGrade: string
    assessedAt: string
    assessedBy: string
  }
}
