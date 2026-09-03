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

async function safePostApi(endpoint: string, payload: any): Promise<any> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (netErr: any) {
    throw new Error(
      `No se pudo conectar con el servidor (${netErr.message || 'Error de red'}). Verifica tu conexión o el estado de Vercel.`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '');
    if (response.status === 404) {
      throw new Error(
        'El endpoint de IA no fue encontrado (404 en Vercel). Asegúrate de desplegar con el archivo vercel.json y la función /api/index.ts incluidos en el proyecto.'
      );
    }
    throw new Error(
      `Respuesta no válida del servidor (${response.status}): ${text.slice(0, 120)}... Verifica la variable GEMINI_API_KEY en Vercel.`
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error('La respuesta del servidor de IA no tiene formato JSON válido.');
  }

  if (!response.ok || !data.success) {
    const err = data?.error || `Error ${response.status} en el servicio de IA Gemini.`;
    if (err.includes('GEMINI_API_KEY')) {
      throw new Error(
        'Falta configurar la variable GEMINI_API_KEY en tu proyecto de Vercel. Ve a Settings -> Environment Variables y agrégala.'
      );
    }
    throw new Error(err);
  }

  return data;
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
  const data = await safePostApi('/api/gemini/generate-plan', params);
  return data.plan;
}

export async function generateRubric(params: {
  title: string;
  subject: string;
  grade: string;
  evaluationType: 'formative' | 'summative' | 'exam';
  criteriaDescription?: string;
}): Promise<MeducaRubricResponse> {
  const data = await safePostApi('/api/gemini/generate-rubric', params);
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
  const data = await safePostApi('/api/gemini/generate-feedback', params);
  return data.feedback;
}

export async function sendChatMessage(
  message: string,
  history: Array<{ role: 'user' | 'model'; text: string }>,
  context: { subject?: string; groupName?: string; trimester?: number | string }
): Promise<string> {
  const data = await safePostApi('/api/gemini/chat', { message, history, context });
  return data.reply;
}
