// Client-side service to communicate with server Gemini AI endpoints

export interface MeducaPlanResponse {
  title: string;
  area: string;
  objectives: string[];
  achievementIndicators: string[];
  competencies: {
    comunicativa: string;
    logicoMatematica: string;
    mundoFisico: string;
    socialCiudadana: string;
    digital: string;
  };
  contents: {
    conceptuales: string[];
    procedimentales: string[];
    actitudinales: string[];
  };
  learningActivities: {
    inicio: string[];
    desarrollo: string[];
    cierre: string[];
  };
  evaluation: {
    diagnostica: string;
    formativa: string;
    sumativa: string;
  };
  resources: string[];
  weeklyBreakdown: Array<{
    weekNumber: number;
    topic: string;
    activities: string;
    evaluation: string;
  }>;
}

export interface MeducaRubricResponse {
  rubricTitle: string;
  evaluationType: string;
  maxScore: number;
  description: string;
  criteria: Array<{
    name: string;
    weightPercent: number;
    levels: {
      excellent: { score: number; description: string };
      good: { score: number; description: string };
      regular: { score: number; description: string };
      insufficient: { score: number; description: string };
    };
  }>;
  teacherAdvice?: string;
}

export interface MeducaFeedbackResponse {
  qualitativeSummary: string;
  strengthsIdentified: string[];
  recommendationsForStudent: string[];
  parentMessage: string;
  statusLabel: string;
  pedagogicalAlert?: string | null;
}

export async function generateDidacticPlan(params: {
  subject: string;
  grade: string;
  trimester: number;
  weeks: number;
  topic: string;
  levelType: 'primary' | 'secondary';
  competencies?: string[];
  customInstructions?: string;
}): Promise<MeducaPlanResponse> {
  const response = await fetch('/api/gemini/generate-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Error al comunicarse con el servicio de IA Gemini.');
  }

  return data.plan;
}

export async function generateRubric(params: {
  title: string;
  subject: string;
  grade: string;
  evaluationType: 'formative' | 'summative' | 'exam';
  criteriaDescription?: string;
}): Promise<MeducaRubricResponse> {
  const response = await fetch('/api/gemini/generate-rubric', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Error al generar la rúbrica con IA.');
  }

  return data.rubric;
}

export async function generateStudentFeedback(params: {
  studentName: string;
  subject: string;
  trimester: number;
  averageGrade: number;
  formativeAvg: number;
  summativeAvg: number;
  examScore: number;
  attendanceRate: number;
  absencesCount: number;
  strengths?: string;
  challenges?: string;
}): Promise<MeducaFeedbackResponse> {
  const response = await fetch('/api/gemini/generate-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Error al generar observaciones con IA.');
  }

  return data.feedback;
}

export async function sendChatMessage(
  message: string,
  history: Array<{ role: 'user' | 'model'; text: string }>,
  context: { subject?: string; groupName?: string; trimester?: number | string }
): Promise<string> {
  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, context }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Error en el asistente de chat IA.');
  }

  return data.reply;
}
