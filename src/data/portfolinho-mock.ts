import type { PortfolioTemplate, StudentPortfolio } from '@/types/portfolinho'

export const mockTemplate: PortfolioTemplate = {
  id: 'tmpl-1',
  title: 'Argumenterande portfolio',
  course: 'Vetenskaplig kommunikation 7.5 hp',
  semester: 'VT 2026',
  rubric: {
    id: 'rubric-1',
    title: 'Argumenterande text – bedömningsmatris',
    source: 'canvas',
    criteria: [
      {
        id: 'arg',
        title: 'Argumentation',
        description: 'Förmåga att bygga logiska, välunderbyggda argument',
        ratings: [
          { points: 0, label: 'Ej uppnådd', description: 'Argumenten saknar logik eller bevisföring' },
          { points: 1, label: 'Godkänd', description: 'Grundläggande argumentation med viss bevisföring' },
          { points: 2, label: 'Väl godkänd', description: 'Välstrukturerade argument med tydliga bevis' },
          { points: 3, label: 'Utmärkt', description: 'Sofistikerade argument med övertygande bevisföring och bemötande av motargument' },
        ],
      },
      {
        id: 'kall',
        title: 'Källkritik',
        description: 'Kritisk användning och granskning av källor',
        ratings: [
          { points: 0, label: 'Ej uppnådd', description: 'Källorna används okritiskt eller saknas' },
          { points: 1, label: 'Godkänd', description: 'Relevanta källor men kritisk granskning saknas delvis' },
          { points: 2, label: 'Väl godkänd', description: 'Källorna granskas kritiskt och används ändamålsenligt' },
          { points: 3, label: 'Utmärkt', description: 'Exemplarisk källhantering med djup kritisk analys' },
        ],
      },
      {
        id: 'anal',
        title: 'Analytisk förmåga',
        description: 'Förmåga att analysera och syntetisera information',
        ratings: [
          { points: 0, label: 'Ej uppnådd', description: 'Analysen är ytlig eller saknas' },
          { points: 1, label: 'Godkänd', description: 'Grundläggande analys genomförs' },
          { points: 2, label: 'Väl godkänd', description: 'Nyanserad analys med flera perspektiv' },
          { points: 3, label: 'Utmärkt', description: 'Djupgående kritisk analys som syntetiserar komplex information' },
        ],
      },
      {
        id: 'refl',
        title: 'Reflektionsdjup',
        description: 'Förmåga till metakognition och reflektion över lärprocessen',
        ratings: [
          { points: 0, label: 'Ej uppnådd', description: 'Reflektion saknas eller är ytlig' },
          { points: 1, label: 'Godkänd', description: 'Viss reflektion över eget lärande' },
          { points: 2, label: 'Väl godkänd', description: 'Tydlig reflektion kopplad till lärprocessen' },
          { points: 3, label: 'Utmärkt', description: 'Djup metakognitiv reflektion som visar på tydlig tillväxt' },
        ],
      },
    ],
  },
  peerRubrics: [
    {
      id: 'peer-rubric-1',
      title: 'Stödmatris för peer-review',
      questions: [
        { id: 'p1', question: 'Är huvudtesen tydlig? Kan du formulera den med egna ord?' },
        { id: 'p2', question: 'Stöds argumenten av trovärdiga källor?' },
        { id: 'p3', question: 'Tas motargument upp och bemöts de?' },
        { id: 'p4', question: 'Vad är textens starkaste del? Vad kan förbättras?' },
      ],
    },
  ],
  activities: [
    {
      id: 'act-1',
      position: 1,
      title: 'Inledande reflektion',
      type: 'submission',
      description: 'Skriv en sida om dina mål med kursen och din tidigare erfarenhet av akademiskt skrivande.',
      opensWeek: 1,
      deadlineWeek: 2,
      assessmentType: 'none',
      criteriaIds: [],
      notes: 'Formativ, ej bedömd. Används som startpunkt för din slutreflexion.',
    },
    {
      id: 'act-2',
      position: 2,
      title: 'Första utkast',
      type: 'submission',
      description: 'Skriv ett 2–3 sidors argumenterande utkast om valfritt samhällsproblem. Fokusera på struktur och argumentation.',
      opensWeek: 2,
      deadlineWeek: 4,
      assessmentType: 'none',
      criteriaIds: ['arg', 'anal'],
      notes: 'Läraren ger skriftlig feedback inom en vecka.',
    },
    {
      id: 'act-3',
      position: 3,
      title: 'Peer-review',
      type: 'peer_review',
      description: 'Läs och kommentera två klasskamraters utkast med hjälp av den förenklade stödmatrisen.',
      opensWeek: 5,
      deadlineWeek: 6,
      assessmentType: 'pass_fail',
      criteriaIds: ['refl'],
      peerRubricId: 'peer-rubric-1',
      notes: 'Varje student tilldelas 2 anonyma texter. Använd bifogad stödmatris.',
    },
    {
      id: 'act-4',
      position: 4,
      title: 'Självvärdering',
      type: 'self_assessment',
      description: 'Reflektera över den feedback du fått och gett. Vad tar du med dig in i revisionen?',
      opensWeek: 6,
      deadlineWeek: 7,
      assessmentType: 'none',
      criteriaIds: ['refl'],
      notes: '',
    },
    {
      id: 'act-5',
      position: 5,
      title: 'Reviderat utkast',
      type: 'submission',
      description: 'Revidera texten baserat på den feedback du fått. Ange tydligt vilka ändringar du gjort och varför.',
      opensWeek: 7,
      deadlineWeek: 9,
      assessmentType: 'none',
      criteriaIds: ['arg', 'kall', 'anal'],
      notes: '',
    },
    {
      id: 'act-6',
      position: 6,
      title: 'Slutportfolio',
      type: 'submission',
      description: 'Lämna in din kompletta portfolio: alla versioner av texten, peer-review-kommentarer du gett, och en sammanfattande reflektion (1 sida) om din lärprocess.',
      opensWeek: 10,
      deadlineWeek: 13,
      assessmentType: 'rubric_criteria',
      criteriaIds: ['arg', 'kall', 'anal', 'refl'],
      notes: 'Bedöms som helhet mot fullständig matris. Betygssätts A–F.',
    },
  ],
}

export const mockStudentPortfolio: StudentPortfolio = {
  id: 'port-1',
  student: { id: 'stu-1', name: 'Emma Lindström', email: 'emma.lindstrom@student.se' },
  template: mockTemplate,
  currentWeek: 11,
  activityStatuses: {
    'act-1': 'reviewed',
    'act-2': 'reviewed',
    'act-3': 'reviewed',
    'act-4': 'reviewed',
    'act-5': 'submitted',
    'act-6': 'in_progress',
  },
  submissions: [
    {
      id: 'sub-1',
      activityId: 'act-1',
      submittedAt: '2026-01-14',
      content:
        'Mina huvudsakliga mål med kursen är att förbättra min förmåga att skriva klara och välstrukturerade akademiska texter. Jag har länge kämpat med att bygga upp en tydlig argumentation och vill verkligen bli bättre på att använda vetenskapliga källor på ett kritiskt sätt. Jag hoppas också att peer-review-momentet ska ge mig insikt i hur andra tänker kring skrivande och feedback.',
    },
    {
      id: 'sub-2',
      activityId: 'act-2',
      submittedAt: '2026-01-28',
      content:
        'Lokala lösningar på globala klimatproblem\n\nI denna text argumenterar jag för att klimatpolitiken behöver decentraliseras för att bli effektiv. Nationella och internationella avtal har visat sig svåra att implementera, medan kommuner och regioner har visat konkreta framgångar. Forsberg och Lindberg (2022) menar att lokalt engagemang skapar starkare ägarskap för klimatfrågor. Dock finns det risker med fragmentisering som behöver adresseras...',
      teacherComment:
        'Bra ansats och intressant vinkel! Din tes är tydlig men argumentationen behöver mer stöd av vetenskaplig litteratur. Försök att aktivt nyansera och bemöta motargument — finns det forskning som pekar åt andra hållet? Se också över källhanteringen och fokusera på peer-reviewed material.',
    },
    {
      id: 'sub-3',
      activityId: 'act-3',
      submittedAt: '2026-02-11',
      content:
        'Jag har granskat och kommenterat Karim Hassans och Sofia Bergströms utkast utifrån stödmatrisen. Se bifogade kommentarsdokument.',
      peerFeedback: [
        {
          fromStudent: 'Karim Hassan',
          submittedAt: '2026-02-12',
          comment:
            'Ditt ämnesval är verkligen intressant! Din introduktion är stark och fångar läsarens uppmärksamhet direkt. Jag saknar mer djup i analysen av motargumenten — du tar upp dem men bemöter dem inte fullt ut. Källförteckningen behöver ses över, några källor verkar vara från icke-vetenskapliga sajter.',
          responses: {
            p1: 'Ja, tesen om decentraliserad klimatpolitik är tydlig redan i inledningen.',
            p2: 'Delvis — Forsberg & Lindberg används men jag hittar inte källan online. Kolla om den är peer-reviewed.',
            p3: 'Motargumenten nämns men bemöts inte tillräckligt.',
            p4: 'Starkast: inledningen. Förbättra: slutdiskussionen och källkritiken.',
          },
        },
        {
          fromStudent: 'Sofia Bergström',
          submittedAt: '2026-02-13',
          comment:
            'Texten flödar bra och är läsarvänlig. Argumentationen är logisk men ibland lite förenklad. Avsnittet om kommunernas framgångar var det starkaste. Det vore intressant om du jämförde med internationell forskning på området.',
        },
      ],
    },
    {
      id: 'sub-4',
      activityId: 'act-4',
      submittedAt: '2026-02-18',
      content:
        'Efter feedback från lärare och kurskamrater har jag reflekterat mycket. Jag inser att jag tenderar att söka bekräftande argument utan att aktivt söka motargument — det är något jag måste arbeta med. Feedbacken om källhanteringen var värdefull: jag ska fokusera på peer-reviewed artiklar och vara mer kritisk till sekundärkällor. Positivt var att min grundstruktur upplevdes som tydlig av alla — det tar jag med mig.',
    },
    {
      id: 'sub-5',
      activityId: 'act-5',
      submittedAt: '2026-03-04',
      content:
        'Lokala lösningar på globala klimatproblem — reviderad version\n\nI denna version har jag stärkt argumentationen med fler vetenskapliga studier och aktivt bemött motargumenten. Baserat på Andersson et al. (2023) och Wu & Zhang (2021) ser vi ett tydligt mönster av framgångsrik lokal klimatstyrning. Ett centralt motargument är att lokal variation kan leda till ojämlik klimatpolitik — detta bemöter jag genom att föreslå en ramverk-med-flexibilitet-modell där nationella minimikrav kombineras med lokalt handlingsutrymme...',
    },
  ],
}

export const mockStudentList = [
  { id: 'stu-1', name: 'Emma Lindström', progress: 5, total: 6, status: 'in_progress' as const },
  { id: 'stu-2', name: 'Karim Hassan', progress: 5, total: 6, status: 'in_progress' as const },
  { id: 'stu-3', name: 'Sofia Bergström', progress: 6, total: 6, status: 'submitted' as const },
  { id: 'stu-4', name: 'Lucas Pettersson', progress: 4, total: 6, status: 'in_progress' as const },
  { id: 'stu-5', name: 'Aisha Nkrumah', progress: 6, total: 6, status: 'submitted' as const },
]
