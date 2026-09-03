import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY no está configurada en las variables de entorno. Por favor configúrela en el panel de Secretos o en su archivo .env.'
      );
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Registro Digital MEDUCA - Gemini AI Server',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Helper to reliably parse JSON from Gemini text responses
function cleanJsonText(raw: string): string {
  let cleaned = (raw || '').trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

// AI Endpoint: Generador de Planeamiento Didáctico Oficial MEDUCA
app.post('/api/gemini/generate-plan', async (req, res) => {
  try {
    const {
      subject = 'Inglés',
      grade = '7mo Grado',
      trimester = 2,
      weeks = 4,
      topic = 'Simple Present and Daily Routines',
      levelType = 'secondary', // 'primary' or 'secondary'
      competencies = [],
      customInstructions = '',
    } = req.body;

    const ai = getGenAI();

    const systemPrompt = `Eres un Asesor Pedagógico y Curricular experto del Ministerio de Educación de Panamá (MEDUCA).
Tu labor es redactar un Planeamiento Didáctico Trimestral / Semanal Oficial y de alta calidad para docentes panameños según el programa curricular de MEDUCA.

Debes estructurar la respuesta en formato JSON estrictamente válido con las siguientes claves:
{
  "title": "Título descriptivo de la unidad / tema",
  "area": "Área curricular según MEDUCA (ej: Comunicación Oral y Escrita, Comprensión Lectora, etc.)",
  "objectives": ["Objetivo de aprendizaje 1", "Objetivo de aprendizaje 2", "Objetivo de aprendizaje 3"],
  "achievementIndicators": ["Indicador de logro observable 1", "Indicador de logro observable 2", "Indicador de logro observable 3"],
  "competencies": {
    "comunicativa": "Cómo se desarrolla la competencia comunicativa",
    "logicoMatematica": "Cómo se desarrolla el pensamiento lógico",
    "mundoFisico": "Cómo se interactúa con el entorno/mundo físico",
    "socialCiudadana": "Cómo se promueve la convivencia y ciudadanía",
    "digital": "Uso de tecnología y tratamiento de la información"
  },
  "contents": {
    "conceptuales": ["Conceptos clave 1", "Conceptos clave 2"],
    "procedimentales": ["Procedimientos, habilidades y destrezas 1", "Procedimientos 2"],
    "actitudinales": ["Actitudes, valores y disposición 1", "Actitudes 2"]
  },
  "learningActivities": {
    "inicio": ["Actividad de inicio / activación de conocimientos previos"],
    "desarrollo": ["Actividad de desarrollo / construcción del aprendizaje"],
    "cierre": ["Actividad de cierre / consolidación y metacognición"]
  },
  "evaluation": {
    "diagnostica": "Estrategia e instrumento de evaluación diagnóstica",
    "formativa": "Estrategia e instrumento de evaluación formativa (apreciación)",
    "sumativa": "Estrategia e instrumento de evaluación sumativa (pruebas, proyectos o exámenes)"
  },
  "resources": ["Recurso didáctico 1", "Recurso 2", "Recurso 3"],
  "weeklyBreakdown": [
    {
      "weekNumber": 1,
      "topic": "Subtema de la semana 1",
      "activities": "Resumen de actividades semanales",
      "evaluation": "Instrumento o entregable semanal"
    }
  ]
}`;

    const prompt = `Genera un planeamiento didáctico MEDUCA completo para:
- Asignatura: ${subject}
- Nivel / Grado: ${grade} (${levelType === 'primary' ? 'Educación Primaria' : 'Educación Premedia / Media'})
- Trimestre: ${trimester}° Trimestre
- Duración sugerida: ${weeks} semanas
- Tema principal: ${topic}
${competencies.length > 0 ? `- Competencias a priorizar: ${competencies.join(', ')}` : ''}
${customInstructions ? `- Instrucciones pedagógicas adicionales del docente: ${customInstructions}` : ''}

Asegúrate de que los objetivos e indicadores estén redactados con verbos en infinitivo y tercera persona acordes con la taxonomía pedagógica y la normativa panameña de MEDUCA. Devuelve únicamente el JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(cleanJsonText(text));
    res.json({ success: true, plan: parsed });
  } catch (error: any) {
    console.error('Error in /api/gemini/generate-plan:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al generar planeamiento didáctico con IA',
    });
  }
});

// AI Endpoint: Generador de Rúbricas y Criterios de Evaluación MEDUCA
app.post('/api/gemini/generate-rubric', async (req, res) => {
  try {
    const {
      title = 'Presentación Oral / Proyecto',
      subject = 'Inglés',
      grade = '7mo Grado',
      evaluationType = 'summative', // 'formative', 'summative', 'exam'
      criteriaDescription = '',
    } = req.body;

    const ai = getGenAI();

    const systemPrompt = `Eres un especialista en Evaluación de los Aprendizajes bajo el enfoque por competencias de MEDUCA Panamá.
Crea una Rúbrica de Evaluación analítica oficial adaptada a la escala de calificaciones de Panamá (1.0 a 5.0).

Devuelve un JSON estrictamente válido con la siguiente estructura:
{
  "rubricTitle": "Título formal de la rúbrica",
  "evaluationType": "Apreciación / Sumativa / Examen",
  "maxScore": 5.0,
  "description": "Propósito de la evaluación",
  "criteria": [
    {
      "name": "Nombre del criterio (ej. Dominio del Tema)",
      "weightPercent": 25,
      "levels": {
        "excellent": { "score": 5.0, "description": "Descriptor para 5.0 (Excelente)" },
        "good": { "score": 4.0, "description": "Descriptor para 4.0 - 4.9 (Bueno)" },
        "regular": { "score": 3.0, "description": "Descriptor para 3.0 - 3.9 (Regular)" },
        "insufficient": { "score": 1.0, "description": "Descriptor para 1.0 - 2.9 (Deficiente/Insuficiente)" }
      }
    }
  ],
  "teacherAdvice": "Consejo pedagógico para aplicar este instrumento en el aula"
}`;

    const prompt = `Crea una rúbrica analítica detallada para evaluar:
- Actividad: ${title}
- Asignatura: ${subject}
- Grado: ${grade}
- Categoría MEDUCA: ${evaluationType === 'formative' ? 'Apreciación / Formativa' : evaluationType === 'summative' ? 'Parcial / Sumativa' : 'Examen Trimestral'}
${criteriaDescription ? `- Detalles específicos: ${criteriaDescription}` : ''}

Asegura que los descriptores sean claros, objetivos y fáciles de aplicar durante la corrección.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(cleanJsonText(text));
    res.json({ success: true, rubric: parsed });
  } catch (error: any) {
    console.error('Error in /api/gemini/generate-rubric:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al generar la rúbrica con IA',
    });
  }
});

// AI Endpoint: Generador de Observaciones y Recomendaciones Trimestrales para Boletines
app.post('/api/gemini/generate-feedback', async (req, res) => {
  try {
    const {
      studentName = 'Estudiante',
      subject = 'Inglés',
      trimester = 2,
      averageGrade = 4.2,
      formativeAvg = 4.0,
      summativeAvg = 4.3,
      examScore = 4.5,
      attendanceRate = 95,
      absencesCount = 1,
      strengths = '',
      challenges = '',
    } = req.body;

    const ai = getGenAI();

    const systemPrompt = `Eres un docente y orientador educativo de MEDUCA Panamá.
Tu objetivo es redactar observaciones cualitativas y recomendaciones pedagógicas constructivas y profesionales para el boletín de calificaciones o reporte al padre de familia, de acuerdo a la escala MEDUCA (1.0 a 5.0).
El tono debe ser motivador, respetuoso, formativo y enfocado en la mejora continua.

Devuelve un JSON con:
{
  "qualitativeSummary": "Síntesis cualitativa del desempeño en 2-3 oraciones",
  "strengthsIdentified": ["Fortaleza 1", "Fortaleza 2"],
  "recommendationsForStudent": ["Recomendación práctica 1", "Recomendación práctica 2"],
  "parentMessage": "Mensaje formal y cordial dirigido al padre de familia o acudiente",
  "statusLabel": "Excelente / Satisfactorio / En Proceso de Refuerzo / Requiere Revalidación",
  "pedagogicalAlert": "null o alerta temprana de apoyo si el promedio es menor a 3.0"
}`;

    const prompt = `Genera observaciones trimestrales oficiales para:
- Estudiante: ${studentName}
- Asignatura: ${subject} (${trimester}° Trimestre)
- Promedio Trimestral Actual: ${averageGrade.toFixed(1)} / 5.0 (Apreciación: ${formativeAvg.toFixed(1)}, Parciales: ${summativeAvg.toFixed(1)}, Examen: ${examScore.toFixed(1)})
- Asistencia: ${attendanceRate}% (${absencesCount} ausencias registradas)
${strengths ? `- Fortalezas observadas: ${strengths}` : ''}
${challenges ? `- Áreas a reforzar: ${challenges}` : ''}

Formula sugerencias pedagógicas claras tanto para el alumno como para el acudiente.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(cleanJsonText(text));
    res.json({ success: true, feedback: parsed });
  } catch (error: any) {
    console.error('Error in /api/gemini/generate-feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al generar observaciones con IA',
    });
  }
});

// AI Endpoint: Chat Asistente Pedagógico MEDUCA (Teacher Copilot)
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, history = [], context = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Mensaje requerido' });
    }

    const ai = getGenAI();

    const systemPrompt = `Eres "Asistente IA Docente MEDUCA", un copiloto pedagógico inteligente diseñado para auxiliar a los maestros y profesores de Panamá en su gestión académica diaria en el Registro Digital.
Tus áreas de especialidad son:
1. Normativa y currículo oficial del Ministerio de Educación de Panamá (MEDUCA), Decreto 618, calendario escolar de 3 trimestres, escala de 1.0 a 5.0.
2. Estrategias metodológicas activas, diseño universal para el aprendizaje (DUA) y adecuaciones curriculares para estudiantes con necesidades educativas especiales (NEE).
3. Elaboración de pruebas sumativas, exámenes trimestrales, cuestionarios, dinámicas grupales y rúbricas.
4. Redacción de informes para la Dirección del plantel, actas de reuniones de acudientes y justificaciones de ausencias.

Contexto actual del docente:
- Asignatura activa: ${context.subject || 'Inglés / General'}
- Grupo activo: ${context.groupName || 'Grupo Actual'}
- Trimestre en curso: ${context.trimester || 'Trimestre 2'}

Responde de forma concisa, clara, estructurada con viñetas o tablas cuando sea pertinente, y con un trato profesional y cordial ("Colega docente").`;

    // Format chat contents
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history) {
        if (h.role && h.text) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }],
          });
        }
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const reply = response.text || 'Sin respuesta generada.';
    res.json({ success: true, reply });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error en el asistente de chat IA',
    });
  }
});

// Vite Middleware & Production static serve
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Registro Digital MEDUCA listo en http://localhost:${PORT}`);
  });
}

startServer();
