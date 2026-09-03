import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY no está configurada en las variables de entorno de Vercel. Por favor agrégala en Project Settings -> Environment Variables.'
      );
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'meduca-registro-vercel',
        },
      },
    });
  }
  return genAIClient;
}

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

// Health check endpoint
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Registro Digital MEDUCA - Vercel Serverless Function',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// AI Endpoint: Generador de Planeamiento Didáctico Oficial MEDUCA
app.post(['/api/gemini/generate-plan', '/gemini/generate-plan'], async (req, res) => {
  try {
    const {
      subject = 'Inglés',
      grade = '7mo Grado',
      trimester = 2,
      weeks = 4,
      topic = 'Simple Present and Daily Routines',
      levelType = 'secondary',
      competencies = [],
      customInstructions = '',
    } = req.body;

    const ai = getGenAI();

    const systemPrompt = `Eres un Asesor Pedagógico y Curricular experto del Ministerio de Educación de Panamá (MEDUCA).
Tu labor es redactar un Planeamiento Didáctico Trimestral / Semanal Oficial y de alta calidad para docentes panameños según el programa curricular de MEDUCA.

Debes estructurar la respuesta en formato JSON estrictamente válido con las siguientes claves:
{
  "title": "Título descriptivo de la unidad / tema",
  "area": "Área curricular según MEDUCA",
  "objectives": ["Objetivo de aprendizaje 1", "Objetivo 2", "Objetivo 3"],
  "achievementIndicators": ["Indicador observable 1", "Indicador 2", "Indicador 3"],
  "competencies": {
    "comunicativa": "Desarrollo de la competencia comunicativa",
    "logicoMatematica": "Desarrollo del pensamiento lógico-matemático",
    "mundoFisico": "Interacción con el mundo físico y naturaleza",
    "socialCiudadana": "Convivencia social y valores cívicos",
    "digital": "Tratamiento de la información y competencia digital"
  },
  "contents": {
    "conceptuales": ["Concepto 1", "Concepto 2"],
    "procedimentales": ["Procedimiento 1", "Procedimiento 2"],
    "actitudinales": ["Actitud 1", "Actitud 2"]
  },
  "learningActivities": {
    "inicio": ["Actividad de inicio"],
    "desarrollo": ["Actividad de desarrollo"],
    "cierre": ["Actividad de cierre"]
  },
  "evaluation": {
    "diagnostica": "Estrategia de evaluación diagnóstica",
    "formativa": "Estrategia de evaluación formativa",
    "sumativa": "Estrategia de evaluación sumativa"
  },
  "resources": ["Recurso 1", "Recurso 2"],
  "weeklyBreakdown": [
    {
      "weekNumber": 1,
      "topic": "Subtema semana 1",
      "activities": "Actividades semanales",
      "evaluation": "Entregable"
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
    console.error('Error in Vercel /api/gemini/generate-plan:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al generar planeamiento didáctico con IA en Vercel',
    });
  }
});

// AI Endpoint: Generador de Rúbricas Automatizadas MEDUCA
app.post(['/api/gemini/generate-rubric', '/gemini/generate-rubric'], async (req, res) => {
  try {
    const {
      title = 'Proyecto de Investigación',
      subject = 'Ciencias Naturales',
      grade = '8vo Grado',
      evaluationType = 'summative',
      criteriaDescription = '',
    } = req.body;

    const ai = getGenAI();

    const systemPrompt = `Eres un especialista en Evaluación de los Aprendizajes del Ministerio de Educación de Panamá (MEDUCA).
Diseña una matriz de evaluación (rúbrica o escala estimativa analítica) oficial con criterios ponderados y descriptores de desempeño.
Responde únicamente en formato JSON con la siguiente estructura:
{
  "rubricTitle": "Título de la rúbrica",
  "evaluationType": "Diagnóstica, Formativa o Sumativa",
  "maxScore": 100,
  "description": "Propósito pedagógico de la evaluación",
  "criteria": [
    {
      "name": "Criterio de evaluación",
      "weightPercent": 25,
      "levels": {
        "excellent": { "score": 5, "description": "Descriptor para 5.0 (Excelente)" },
        "good": { "score": 4, "description": "Descriptor para 4.0 (Bueno)" },
        "regular": { "score": 3, "description": "Descriptor para 3.0 (Regular)" },
        "insufficient": { "score": 2, "description": "Descriptor para 2.0-1.0 (Por mejorar)" }
      }
    }
  ],
  "teacherAdvice": "Recomendaciones para el docente durante la aplicación"
}`;

    const prompt = `Crea una rúbrica analítica para:
- Actividad: ${title}
- Asignatura: ${subject}
- Nivel: ${grade}
- Tipo de evaluación: ${evaluationType}
${criteriaDescription ? `- Enfoque o criterios deseados: ${criteriaDescription}` : ''}

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
    console.error('Error in Vercel /api/gemini/generate-rubric:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al generar rúbrica de evaluación',
    });
  }
});

// AI Endpoint: Observaciones Cualitativas y Retroalimentación para Boletín
app.post(['/api/gemini/generate-feedback', '/gemini/generate-feedback'], async (req, res) => {
  try {
    const {
      studentName = 'Estudiante',
      averages = {},
      attendanceStats = {},
      trimester = 1,
      specificNotes = '',
    } = req.body;

    const ai = getGenAI();

    const systemPrompt = `Eres un Orientador Pedagógico del Ministerio de Educación de Panamá (MEDUCA).
Tu tarea es redactar una observación cualitativa oficial, asertiva y motivadora para el boletín escolar de un estudiante panameño (escala de 1.0 a 5.0, donde 3.0 es la nota mínima de aprobación).
Responde únicamente en formato JSON con la siguiente estructura:
{
  "qualitativeSummary": "Párrafo formal y empático describiendo el desempeño general del estudiante.",
  "strengthsIdentified": ["Fortaleza 1", "Fortaleza 2"],
  "recommendationsForStudent": ["Sugerencia práctica 1", "Sugerencia 2"],
  "parentMessage": "Mensaje respetuoso y constructivo dirigido al acudiente o tutor legal.",
  "statusLabel": "Sobresaliente | Bueno | Regular | En Riesgo Académico",
  "pedagogicalAlert": "null o alerta temprana si el promedio es menor a 3.0 o presenta ausencias recurrentes"
}`;

    const prompt = `Analiza los siguientes datos del estudiante para el ${trimester}° Trimestre:
- Nombre: ${studentName}
- Notas: ${JSON.stringify(averages)}
- Asistencia: ${JSON.stringify(attendanceStats)}
${specificNotes ? `- Notas del docente: ${specificNotes}` : ''}

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
    console.error('Error in Vercel /api/gemini/generate-feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al generar observaciones con IA',
    });
  }
});

// AI Endpoint: Chat Asistente Pedagógico MEDUCA
app.post(['/api/gemini/chat', '/gemini/chat'], async (req, res) => {
  try {
    const { message = '', history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, error: 'Mensaje requerido' });
      return;
    }

    const ai = getGenAI();

    const systemPrompt = `Eres "Prof. Asesor MEDUCA", un asistente de inteligencia artificial altamente especializado en la labor docente de la República de Panamá.
Conoces en profundidad:
1. El calendario escolar oficial de MEDUCA, las semanas lectivas, de receso y exámenes trimestrales.
2. La escala de calificación panameña de 1.0 a 5.0 (nota mínima de aprobación: 3.0).
3. Los tipos de evaluación en Panamá: diagnóstica, formativa (apreciación) y sumativa.
4. Las 8 competencias básicas del currículo MEDUCA.
5. Los Decretos Ejecutivos del régimen de evaluación y deberes docentes panameños.

Responde siempre de manera cálida, profesional, pedagógicamente rigurosa y orientada a facilitar el trabajo del docente. Usa formato Markdown limpio con negritas y listas.`;

    const contents = history.map((item: any) => ({
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.content || item.text || '' }],
    }));

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
    console.error('Error in Vercel /api/gemini/chat:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error en el asistente de chat IA',
    });
  }
});

export default app;
