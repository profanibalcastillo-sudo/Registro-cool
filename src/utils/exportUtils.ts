import {
  EvaluationColumn,
  Grade,
  Group,
  Student,
  TeacherProfile,
  ThemePlanner,
  WeeklyPlanner,
  TrimesterId,
  SkillLessonPlan,
} from '../types';
import {
  calculateStudentTrimesterGrade,
  formatGrade,
  isPrimaryEducation,
} from './gradeCalculations';

export function exportGradesToCSV(
  group: Group,
  students: Student[],
  columns: EvaluationColumn[],
  grades: Record<string, Grade> | Grade[],
  trimester: TrimesterId | number
) {
  const groupStudents = students.filter((s) => s.groupId === group.id && s.active !== false);
  const trimesterColumns = (columns || []).filter(
    (c) => c.groupId === group.id && Number(c.trimester) === Number(trimester)
  );

  const headers = [
    'N°',
    'Cédula / Documento',
    'Apellidos',
    'Nombres',
    ...trimesterColumns.map((c) => `"${c.title.replace(/"/g, '""')}"`),
    'Promedio Trimestral',
    'Condición MEDUCA',
  ];

  const rows = groupStudents.map((s, idx) => {
    const calc = calculateStudentTrimesterGrade(s.id, trimesterColumns, grades, trimester);
    const scores = trimesterColumns.map((col) => {
      let scoreVal: number | string = '';
      if (Array.isArray(grades)) {
        const found = grades.find(
          (g) => g.studentId === s.id && (g.activityId === col.id || g.columnId === col.id)
        );
        if (found && found.score !== undefined && found.score !== null) scoreVal = found.score;
      } else {
        const key1 = `grd-${s.id}-${col.id}`;
        const key2 = `${s.id}-${col.id}`;
        const g = grades[key1] || grades[key2];
        if (g && g.score !== undefined && g.score !== null) scoreVal = g.score;
      }
      return scoreVal;
    });

    return [
      idx + 1,
      `"${s.documentId || s.cedula || ''}"`,
      `"${s.lastName}"`,
      `"${s.firstName}"`,
      ...scores,
      formatGrade(calc.trimesterGrade),
      `"${calc.statusLabel}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Libreta_${group.name}_T${trimester}_2026.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Universal print handler compatible with old iPad Safari and popup blockers.
 * Uses a hidden iframe embedded in the current DOM instead of fragile popups,
 * with graceful fallback to window.open if needed.
 */
export function printHTMLSafely(htmlContent: string, documentTitle: string = 'Documento') {
  try {
    // 1. Remove previous print iframe if it exists
    const existingFrame = document.getElementById('meduca_print_iframe');
    if (existingFrame) {
      existingFrame.remove();
    }

    // 2. Create invisible iframe attached directly to DOM (No popup required on iPad Safari!)
    const iframe = document.createElement('iframe');
    iframe.id = 'meduca_print_iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      // Give iPad Safari a brief tick to process styles, fonts and layout
      setTimeout(() => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
        } catch (e) {
          console.warn('Direct iframe print attempt failed, using fallback:', e);
          fallbackWindowPrint(htmlContent);
        }
      }, 400);
      return;
    }
  } catch (err) {
    console.warn('Iframe print creation error:', err);
  }

  // Fallback to window.open if iframe is blocked
  fallbackWindowPrint(htmlContent);
}

function fallbackWindowPrint(htmlContent: string) {
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);
    }
  } catch (e) {
    console.error('Window print error:', e);
  }
}

export function exportToPrintableHTML(
  group: Group,
  students: Student[],
  columns: EvaluationColumn[],
  grades: Record<string, Grade> | Grade[],
  trimester: number,
  teacherInfo: {
    name: string;
    email: string;
    school: string;
    region: string;
    signatureDataUrl?: string;
  },
  groupStats?: any
) {
  const groupStudents = students.filter((s) => s.groupId === group.id && s.active !== false);
  const trimesterColumns = (columns || []).filter(
    (c) => c.groupId === group.id && Number(c.trimester) === Number(trimester)
  );

  const formativeCols = trimesterColumns.filter((c) => c.category === 'formative');
  const summativeCols = trimesterColumns.filter((c) => c.category === 'summative');
  const examCols = trimesterColumns.filter((c) => c.category === 'exam');

  const tableRows = groupStudents
    .map((student, idx) => {
      const calc = calculateStudentTrimesterGrade(student.id, trimesterColumns, grades, trimester);

      const renderCategoryCells = (cols: EvaluationColumn[]) =>
        cols
          .map((col) => {
            let scoreVal: number | string = '-';
            if (Array.isArray(grades)) {
              const g = grades.find(
                (entry) =>
                  entry.studentId === student.id &&
                  (entry.activityId === col.id || entry.columnId === col.id)
              );
              if (g && g.score !== undefined && g.score !== null) scoreVal = g.score.toFixed(1);
            } else {
              const key1 = `grd-${student.id}-${col.id}`;
              const key2 = `${student.id}-${col.id}`;
              const g = grades[key1] || grades[key2];
              if (g && g.score !== undefined && g.score !== null) scoreVal = g.score.toFixed(1);
            }
            return `<td style="text-align:center; font-family: monospace;">${scoreVal}</td>`;
          })
          .join('');

      const statusColor = calc.isPassing ? '#15803d' : '#b91c1c';

      return `
        <tr>
          <td style="text-align:center; font-weight:bold; color:#64748b;">${idx + 1}</td>
          <td style="font-family: monospace; font-size: 10px;">${student.documentId || student.cedula || ''}</td>
          <td style="font-weight: 600; text-transform: uppercase;">${student.lastName}, ${student.firstName}</td>
          ${renderCategoryCells(formativeCols)}
          <td style="text-align:center; font-weight:bold; background:#f8fafc;">${calc.formativeAvg ? calc.formativeAvg.toFixed(1) : '-'}</td>
          ${renderCategoryCells(summativeCols)}
          <td style="text-align:center; font-weight:bold; background:#f8fafc;">${calc.summativeAvg ? calc.summativeAvg.toFixed(1) : '-'}</td>
          ${renderCategoryCells(examCols)}
          <td style="text-align:center; font-weight:bold; font-size:12px; background:#eff6ff;">${formatGrade(calc.trimesterGrade)}</td>
          <td style="text-align:center; font-weight:bold; color:${statusColor};">${calc.statusLabel}</td>
        </tr>
      `;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Registro Auxiliar de Evaluación - ${group.name}</title>
      <style>
        @page { size: letter landscape; margin: 10mm; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #0f172a; margin: 0; padding: 10px; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
        .header h1 { font-size: 14px; margin: 0 0 4px 0; text-transform: uppercase; }
        .header h2 { font-size: 12px; margin: 0 0 6px 0; font-weight: normal; }
        .info-grid { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { border: 1px solid #94a3b8; padding: 4px 6px; font-size: 10px; }
        th { background-color: #0f172a; color: #ffffff; text-align: center; font-size: 9px; text-transform: uppercase; }
        .subth { background-color: #334155; color: #f8fafc; font-size: 8px; }
        .signature-section { display: flex; justify-content: space-around; margin-top: 40px; }
        .sig-box { text-align: center; width: 250px; border-top: 1px solid #475569; padding-top: 5px; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>República de Panamá • Ministerio de Educación</h1>
        <h2>Registro Oficial y Cuadro de Calificaciones Trimestrales</h2>
      </div>

      <div class="info-grid">
        <div><strong>Centro Educativo:</strong> ${teacherInfo.school}</div>
        <div><strong>Región:</strong> ${teacherInfo.region}</div>
        <div><strong>Docente:</strong> ${teacherInfo.name}</div>
        <div><strong>Grupo:</strong> ${group.name} (${group.subject || 'Inglés'})</div>
        <div><strong>Trimestre:</strong> Trimestre ${trimester}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width:25px;">N°</th>
            <th rowspan="2" style="width:80px;">Cédula</th>
            <th rowspan="2">Nombre del Estudiante</th>
            <th colspan="${formativeCols.length + 1}">Apreciación / Formativa (33%)</th>
            <th colspan="${summativeCols.length + 1}">Cotidianas / Sumativa (33%)</th>
            <th colspan="${examCols.length || 1}">Examen (34%)</th>
            <th rowspan="2" style="width:50px;">Promedio</th>
            <th rowspan="2" style="width:70px;">Condición</th>
          </tr>
          <tr>
            ${formativeCols.map((c) => `<th class="subth">${c.title}</th>`).join('')}
            <th class="subth">Prom.</th>
            ${summativeCols.map((c) => `<th class="subth">${c.title}</th>`).join('')}
            <th class="subth">Prom.</th>
            ${examCols.length ? examCols.map((c) => `<th class="subth">${c.title}</th>`).join('') : '<th class="subth">Prueba</th>'}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="signature-section">
        <div class="sig-box">
          ${teacherInfo.signatureDataUrl ? `<img src="${teacherInfo.signatureDataUrl}" style="height:45px; max-width:200px; display:block; margin:0 auto;" />` : '<div style="height:45px;"></div>'}
          <strong>${teacherInfo.name}</strong><br/>
          Docente de la Asignatura
        </div>
        <div class="sig-box">
          <div style="height:45px;"></div>
          <strong>Dirección del Plantel</strong><br/>
          Firma y Sello de Autoridad
        </div>
      </div>
    </body>
    </html>
  `;
  printHTMLSafely(htmlContent, `Registro_${group.name}_T${trimester}`);
}

export function exportThemePlannerToHTML(
  teacher: TeacherProfile | { name: string; email: string; school?: string; schoolName?: string; region?: string; signatureDataUrl?: string },
  group: Group,
  planner: ThemePlanner
) {
  const schoolName = (teacher as any).schoolName || (teacher as any).school || 'Centro Educativo';
  const regionName = (teacher as any).region || 'Chiriquí';
  const teacherName = teacher.name || 'Prof. Aníbal Castillo';

  const standardsRows = (planner.standardsAndOutcomes || [])
    .map(
      (so, i) => `
      <tr>
        <td style="text-align:center; font-weight:bold; background:#f1f5f9;">${i + 1}</td>
        <td style="font-weight:bold; color:#1e1b4b;">${so.skillName} (${so.skill.toUpperCase()})</td>
        <td>${so.specificCurriculumStandard || 'Estándar curricular MEDUCA'}</td>
        <td>${so.expectedLearningOutcome || 'Logro esperado de aprendizaje'}</td>
      </tr>
    `
    )
    .join('');

  const lessonsOverviewRows = (planner.lessons || [])
    .map(
      (l) => `
      <tr>
        <td style="text-align:center; font-weight:bold; background:#f8fafc;">L${l.lessonNumber}</td>
        <td style="font-weight:bold; color:#4338ca;">${l.skillTitle}</td>
        <td>${l.specificObjective}</td>
        <td>${l.learningOutcome}</td>
        <td style="text-align:center; font-family:monospace; font-weight:bold;">${l.totalTimeMinutes} min</td>
        <td>${l.formativeAssessmentStrategy || 'Evaluación continua'}</td>
      </tr>
    `
    )
    .join('');

  const content = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Planificación Didáctica por Tema - MEDUCA - ${planner.themeTitle}</title>
      <style>
        @page { size: letter portrait; margin: 10mm; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5px; color: #0f172a; line-height: 1.35; margin: 0; padding: 12px; }
        .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 8px; margin-bottom: 12px; }
        .header h1 { font-size: 13px; margin: 0 0 3px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .header h2 { font-size: 11px; margin: 0 0 3px 0; color: #334155; }
        .header h3 { font-size: 12px; margin: 2px 0 0 0; color: #1e3a8a; text-transform: uppercase; }
        .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 10px; border-radius: 4px; margin-bottom: 10px; font-size: 10px; }
        .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #ffffff; background: #1e293b; padding: 4px 8px; margin-top: 10px; margin-bottom: 4px; border-radius: 2px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9.5px; }
        th, td { border: 1px solid #94a3b8; padding: 4px 6px; text-align: left; }
        th { background: #334155; color: #ffffff; text-align: center; text-transform: uppercase; font-size: 9px; }
        .card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px; }
        .info-card { background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 8px; border-radius: 4px; font-size: 9.5px; }
        .info-card strong { display: block; color: #1e3a8a; margin-bottom: 2px; text-transform: uppercase; font-size: 8.5px; }
        .signature-section { display: flex; justify-content: space-around; margin-top: 25px; page-break-inside: avoid; }
        .sig-box { text-align: center; width: 220px; border-top: 1px solid #475569; padding-top: 4px; font-size: 10px; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="header">
        <h1>República de Panamá • Ministerio de Educación</h1>
        <h2>Dirección Nacional de Currículo y Tecnología Educativa • Región de ${regionName}</h2>
        <h3>Planificación Didáctica Trimestral por Competencias • Asignatura de Inglés</h3>
      </div>

      <div class="meta-grid">
        <div><strong>Centro Educativo:</strong> ${schoolName}</div>
        <div><strong>Docente:</strong> ${teacherName}</div>
        <div><strong>Grupo / Nivel:</strong> ${group.name} (${group.grade || '7mo - 12mo'})</div>
        <div><strong>Trimestre:</strong> Trimestre ${planner.trimester || 1} (Año 2026)</div>
        <div><strong>Tema N° ${planner.themeNumber}:</strong> ${planner.themeTitle}</div>
        <div><strong>Nivel MCER / Rango:</strong> ${planner.cefrLevel || 'A1.3'} • ${planner.weeksRange || 'Semanas 1-4'}</div>
        <div style="grid-column: span 3;"><strong>Escenario Contextual:</strong> ${planner.scenario || 'Ambiente de aprendizaje contextualizado'}</div>
      </div>

      <div class="section-title">1. Competencias Fundamentales MEDUCA (5 Habilidades Lingüísticas)</div>
      <table>
        <thead>
          <tr>
            <th style="width: 25px;">N°</th>
            <th style="width: 140px;">Competencia / Habilidad</th>
            <th>Estándar Curricular de Aprendizaje</th>
            <th>Logro Esperado e Indicador de Logro</th>
          </tr>
        </thead>
        <tbody>
          ${standardsRows}
        </tbody>
      </table>

      <div class="section-title">2. Competencias Integradas & Proyecto de Unidad</div>
      <div class="card-grid">
        <div class="info-card">
          <strong>Gramática Clave</strong>
          ${planner.competences?.linguistic?.grammar || 'Estructuras gramaticales de la unidad'}
        </div>
        <div class="info-card">
          <strong>Vocabulario Meta & Fonética</strong>
          ${planner.competences?.linguistic?.vocabulary || 'Léxico contextualizado'} <br/>
          <span style="color:#64748b; font-size:8.5px;">Fonética: ${planner.competences?.linguistic?.phonetics || 'Pronunciación y entonación'}</span>
        </div>
        <div class="info-card">
          <strong>Funciones Comunicativas</strong>
          ${planner.competences?.pragmatic?.communicativeFunctions || 'Uso práctico del idioma en contexto real'}
        </div>
      </div>

      <div class="card-grid">
        <div class="info-card" style="grid-column: span 2;">
          <strong>Proyecto de Unidad (Integración de Competencias)</strong>
          <b>${planner.unitProject?.title || 'Proyecto Integrador'}</b>: ${planner.unitProject?.description || 'Desarrollo práctico colaborativo.'}
        </div>
        <div class="info-card">
          <strong>Recursos & Adecuaciones</strong>
          ${planner.materialsAndResources || 'Pizarra, Guías MEDUCA, Recursos Digitales'}<br/>
          <span style="color:#64748b; font-size:8.5px;">Adecuación: ${planner.differentiatedInstruction || 'Atención a la diversidad'}</span>
        </div>
      </div>

      <div class="section-title">3. Secuencia Didáctica de Clases Planificadas (Neuroeducación)</div>
      <table>
        <thead>
          <tr>
            <th style="width: 25px;">Lecc.</th>
            <th style="width: 110px;">Habilidad Clave</th>
            <th>Objetivo Específico de Clase</th>
            <th>Logro de Aprendizaje</th>
            <th style="width: 45px;">Tiempo</th>
            <th style="width: 120px;">Evaluación Formativa</th>
          </tr>
        </thead>
        <tbody>
          ${lessonsOverviewRows}
        </tbody>
      </table>

      <div class="signature-section">
        <div class="sig-box">
          ${(teacher as any).signatureDataUrl ? `<img src="${(teacher as any).signatureDataUrl}" style="height:40px; max-width:180px; display:block; margin:0 auto;" />` : '<div style="height:40px;"></div>'}
          <strong>${teacherName}</strong><br/>
          Docente de Inglés • Cédula / Registro
        </div>
        <div class="sig-box">
          <div style="height:40px;"></div>
          <strong>Dirección / Coordinación Pedagógica</strong><br/>
          Firma y Sello Oficial MEDUCA
        </div>
      </div>
    </body>
    </html>
  `;
  printHTMLSafely(content, `Plan_Trimestral_${group.name}_Tema_${planner.themeNumber}`);
}

/**
 * Export a Single Lesson Plan (Por Lección) with the 6 Neuroscience-based Stages
 */
export function exportLessonPlanToHTML(
  teacher: TeacherProfile | { name: string; email: string; school?: string; schoolName?: string; region?: string; signatureDataUrl?: string },
  group: Group,
  planner: ThemePlanner,
  lesson: SkillLessonPlan
) {
  const schoolName = (teacher as any).schoolName || (teacher as any).school || 'Centro Educativo';
  const regionName = (teacher as any).region || 'Chiriquí';
  const teacherName = teacher.name || 'Prof. Aníbal Castillo';

  const stagesRows = (lesson.stages || [])
    .map(
      (stg) => `
      <tr>
        <td style="text-align:center; font-weight:bold; background:#f1f5f9; width:35px;">
          E${stg.stageNumber}
        </td>
        <td style="font-weight:bold; color:#1e1b4b; width:130px;">
          ${stg.shortName || stg.name}
          <div style="font-size:8.5px; color:#64748b; font-weight:normal; margin-top:2px;">Duración: ${stg.durationMinutes} min</div>
        </td>
        <td>
          <div style="font-size:10px; margin-bottom:4px; line-height:1.4;">${stg.description}</div>
          ${
            stg.neuroscienceInsight
              ? `
            <div style="background:#faf5ff; border:1px solid #e9d5ff; border-radius:3px; padding:3px 6px; font-size:9px; color:#581c87;">
              <strong>Fundamento Neuroeducativo (${stg.neuroscienceInsight.title}):</strong> ${stg.neuroscienceInsight.description}
            </div>
          `
              : ''
          }
        </td>
      </tr>
    `
    )
    .join('');

  const content = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Plan de Clase - Lección ${lesson.lessonNumber} - ${lesson.skillTitle}</title>
      <style>
        @page { size: letter portrait; margin: 10mm; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5px; color: #0f172a; line-height: 1.35; margin: 0; padding: 12px; }
        .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 8px; margin-bottom: 12px; }
        .header h1 { font-size: 13px; margin: 0 0 3px 0; text-transform: uppercase; }
        .header h2 { font-size: 11px; margin: 0 0 3px 0; color: #334155; }
        .header h3 { font-size: 12px; margin: 2px 0 0 0; color: #4338ca; text-transform: uppercase; }
        .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 10px; border-radius: 4px; margin-bottom: 10px; font-size: 10px; }
        .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #ffffff; background: #1e293b; padding: 4px 8px; margin-top: 10px; margin-bottom: 4px; border-radius: 2px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9.5px; }
        th, td { border: 1px solid #94a3b8; padding: 5px 6px; text-align: left; }
        th { background: #334155; color: #ffffff; text-align: center; text-transform: uppercase; font-size: 9px; }
        .card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 8px; }
        .info-card { background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 8px; border-radius: 4px; font-size: 9.5px; }
        .info-card strong { display: block; color: #1e3a8a; margin-bottom: 2px; text-transform: uppercase; font-size: 8.5px; }
        .signature-section { display: flex; justify-content: space-around; margin-top: 25px; page-break-inside: avoid; }
        .sig-box { text-align: center; width: 220px; border-top: 1px solid #475569; padding-top: 4px; font-size: 10px; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="header">
        <h1>República de Panamá • Ministerio de Educación</h1>
        <h2>Región Escolar de ${regionName} • Centro Educativo ${schoolName}</h2>
        <h3>Plan de Clase Neurodidáctico en 6 Etapas • Lección N° ${lesson.lessonNumber}: ${lesson.skillTitle}</h3>
      </div>

      <div class="meta-grid">
        <div><strong>Docente:</strong> ${teacherName}</div>
        <div><strong>Grupo / Grado:</strong> ${group.name} (${group.grade || '7mo - 12mo'})</div>
        <div><strong>Trimestre / Año:</strong> Trimestre ${planner.trimester || 1} • 2026</div>
        <div><strong>Tema General:</strong> ${planner.themeTitle}</div>
        <div><strong>Habilidad / Skill:</strong> ${lesson.skillTitle} (${lesson.skill.toUpperCase()})</div>
        <div><strong>Tiempo Total de Clase:</strong> ${lesson.totalTimeMinutes} minutos</div>
        <div style="grid-column: span 3;"><strong>Objetivo Específico:</strong> ${lesson.specificObjective}</div>
        <div style="grid-column: span 3;"><strong>Logro de Aprendizaje:</strong> ${lesson.learningOutcome}</div>
      </div>

      <div class="section-title">Desarrollo Secuencial de la Clase en 6 Etapas con Neuroeducación</div>
      <table>
        <thead>
          <tr>
            <th style="width: 35px;">Etapa</th>
            <th style="width: 130px;">Fase Neurodidáctica</th>
            <th>Actividades de Aprendizaje & Aportes de la Neurociencia</th>
          </tr>
        </thead>
        <tbody>
          ${stagesRows}
        </tbody>
      </table>

      <div class="section-title">Evaluación, Refuerzo y Metacognición</div>
      <div class="card-grid">
        <div class="info-card">
          <strong>Estrategia de Evaluación Formativa</strong>
          ${lesson.formativeAssessmentStrategy || 'Observación activa, rúbrica de desempeño y tickets de salida.'}
        </div>
        <div class="info-card">
          <strong>Tarea de Refuerzo / Homework</strong>
          ${lesson.reinforcementHomework || 'Práctica guiada en casa y aplicación del vocabulario meta.'}
        </div>
      </div>

      <div class="signature-section">
        <div class="sig-box">
          ${(teacher as any).signatureDataUrl ? `<img src="${(teacher as any).signatureDataUrl}" style="height:40px; max-width:180px; display:block; margin:0 auto;" />` : '<div style="height:40px;"></div>'}
          <strong>${teacherName}</strong><br/>
          Docente de Inglés • Firma Oficial
        </div>
        <div class="sig-box">
          <div style="height:40px;"></div>
          <strong>Coordinación / Dirección Escolar</strong><br/>
          Revisado y Aprobado MEDUCA
        </div>
      </div>
    </body>
    </html>
  `;
  printHTMLSafely(content, `Plan_Clase_${group.name}_Leccion_${lesson.lessonNumber}`);
}

export function exportWeeklyPlannerToHTML(
  teacher: TeacherProfile | { name: string; email: string; school?: string; schoolName?: string; region?: string; signatureDataUrl?: string },
  group: Group,
  planner: WeeklyPlanner
) {
  const schoolName = (teacher as any).schoolName || (teacher as any).school || 'Centro Educativo';
  const regionName = (teacher as any).region || 'Chiriquí';
  const teacherName = teacher.name || 'Prof. Aníbal Castillo';

  const content = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Secuencia Didáctica Semanal MEDUCA - Semana ${planner.weekNumber}</title>
      <style>
        @page { size: letter landscape; margin: 10mm; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #0f172a; line-height: 1.35; margin: 0; padding: 10px; }
        .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 6px; margin-bottom: 10px; }
        .header h1 { font-size: 12px; margin: 0 0 2px 0; text-transform: uppercase; }
        .header h2 { font-size: 10px; margin: 0 0 2px 0; color: #334155; }
        .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 8px; border-radius: 4px; margin-bottom: 8px; font-size: 9.5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9.5px; }
        th, td { border: 1px solid #94a3b8; padding: 6px; text-align: left; vertical-align: top; }
        th { background: #1e293b; color: #ffffff; text-align: center; text-transform: uppercase; font-size: 9px; }
        .signature-section { display: flex; justify-content: space-around; margin-top: 20px; page-break-inside: avoid; }
        .sig-box { text-align: center; width: 220px; border-top: 1px solid #475569; padding-top: 4px; font-size: 9.5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>República de Panamá • Ministerio de Educación</h1>
        <h2>Secuencia Didáctica Semanal • Región Escolar de ${regionName} • ${schoolName}</h2>
      </div>

      <div class="meta-grid">
        <div><strong>Docente:</strong> ${teacherName}</div>
        <div><strong>Grupo:</strong> ${group.name} (${group.subject || 'Inglés'})</div>
        <div><strong>Semana N°:</strong> Semana ${planner.weekNumber} (${planner.datesRange || 'Año 2026'})</div>
        <div><strong>Trimestre:</strong> Trimestre ${planner.trimester || 1}</div>
        <div style="grid-column: span 2;"><strong>Área / Tema:</strong> ${planner.area || 'General'} - ${planner.topic}</div>
        <div style="grid-column: span 2;"><strong>Horas Semanales:</strong> ${planner.weeklyHours || 5} horas</div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 33%;">Actividades de Inicio (Warm-up & Motivación)</th>
            <th style="width: 34%;">Actividades de Desarrollo (Práctica y Desempeño)</th>
            <th style="width: 33%;">Actividades de Cierre (Evaluación y Metacognición)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="min-height: 120px;">${planner.learningActivities?.start || 'Actividades de activación de conocimientos previos.'}</td>
            <td>${planner.learningActivities?.development || 'Desarrollo de competencias lingüísticas y actividades guiadas.'}</td>
            <td>${planner.learningActivities?.closure || 'Evaluación formativa, retroalimentación y tickets de salida.'}</td>
          </tr>
        </tbody>
      </table>

      <table>
        <thead>
          <tr>
            <th style="width: 33%;">Competencias Fundamentales</th>
            <th style="width: 34%;">Logros de Aprendizaje</th>
            <th style="width: 33%;">Criterios de Evaluación & Recursos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${planner.fundamentalCompetencies || 'Comunicación lingüística, pensamiento crítico, trabajo colaborativo.'}</td>
            <td>${planner.learningAchievements || 'Aplica los conocimientos y estructuras en situaciones cotidianas.'}</td>
            <td>
              <strong>Criterios:</strong> ${planner.evaluationCriteria || 'Participación, rúbricas y producciones orales/escritas.'}<br/><br/>
              <strong>Recursos:</strong> ${planner.didacticResources || 'Libro de texto, audio, hojas de trabajo, pizarra digital.'}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="signature-section">
        <div class="sig-box">
          ${(teacher as any).signatureDataUrl ? `<img src="${(teacher as any).signatureDataUrl}" style="height:40px; max-width:180px; display:block; margin:0 auto;" />` : '<div style="height:40px;"></div>'}
          <strong>${teacherName}</strong><br/>
          Docente de la Asignatura
        </div>
        <div class="sig-box">
          <div style="height:40px;"></div>
          <strong>Dirección del Plantel</strong><br/>
          Firma y Sello Oficial MEDUCA
        </div>
      </div>
    </body>
    </html>
  `;
  printHTMLSafely(content, `Plan_Semanal_${group.name}_Semana_${planner.weekNumber}`);
}

/**
 * Exports Batch or Single Individual Student Report Cards for Parents (PDF Printable)
 * Supports filtering: All students, or Only failing students (< 3.0) for individual parent follow-up.
 */
export function exportBatchIndividualReportsToHTML(
  group: Group,
  students: Student[],
  columns: EvaluationColumn[],
  grades: Record<string, Grade> | Grade[],
  trimester: number,
  teacherInfo: {
    name: string;
    email: string;
    school: string;
    region: string;
    signatureDataUrl?: string;
  },
  options: {
    onlyFailing?: boolean;
    specificStudentId?: string;
    observations?: Record<string, string>;
    attendanceStats?: Record<string, { present: number; absent: number; late: number; justified: number }>;
  } = {}
) {
  const isPrimary = isPrimaryEducation(group);
  const trimesterColumns = (columns || []).filter(
    (c) => c.groupId === group.id && Number(c.trimester) === Number(trimester)
  );

  let targetStudents = students.filter((s) => s.groupId === group.id && s.active !== false);

  if (options.specificStudentId) {
    targetStudents = targetStudents.filter((s) => s.id === options.specificStudentId);
  }

  // Filter failing students (< 3.0) if onlyFailing is requested
  if (options.onlyFailing) {
    targetStudents = targetStudents.filter((s) => {
      const calc = calculateStudentTrimesterGrade(s.id, trimesterColumns, grades, trimester, undefined, isPrimary);
      return calc.trimesterGrade !== null && calc.trimesterGrade < 3.0;
    });
  }

  if (targetStudents.length === 0) {
    console.warn('No hay estudiantes que cumplan con el filtro seleccionado.');
    return;
  }

  const studentPagesHTML = targetStudents
    .map((student, idx) => {
      const calc = calculateStudentTrimesterGrade(student.id, trimesterColumns, grades, trimester, undefined, isPrimary);
      const isFailing = calc.trimesterGrade !== null && calc.trimesterGrade < 3.0;
      const isHonor = calc.trimesterGrade !== null && calc.trimesterGrade >= 4.5;
      const obs = options.observations?.[student.id] || student.notes || '';
      const att = options.attendanceStats?.[student.id];

      // Render individual evaluation rows
      const evalRows = trimesterColumns.map((col, cIdx) => {
        let scoreVal: number | string = '—';
        let numScore = 0;
        if (Array.isArray(grades)) {
          const g = grades.find(
            (entry) => entry.studentId === student.id && (entry.activityId === col.id || entry.columnId === col.id)
          );
          if (g && g.score !== undefined && g.score !== null) {
            scoreVal = g.score.toFixed(1);
            numScore = g.score;
          }
        } else {
          const key1 = `grd-${student.id}-${col.id}`;
          const key2 = `${student.id}-${col.id}`;
          const g = grades[key1] || grades[key2];
          if (g && g.score !== undefined && g.score !== null) {
            scoreVal = g.score.toFixed(1);
            numScore = g.score;
          }
        }

        const isLow = numScore > 0 && numScore < 3.0;
        const catName = isPrimary
          ? `Parcial ${cIdx + 1}`
          : col.category === 'formative'
          ? 'Apreciación / Formativa (33%)'
          : col.category === 'summative'
          ? 'Parcial / Sumativa (33%)'
          : 'Examen Trimestral (34%)';

        return `
          <tr>
            <td style="text-align: center; color: #64748b; font-weight: bold;">${cIdx + 1}</td>
            <td style="font-weight: 600;">${col.title}</td>
            <td style="font-size: 9.5px; color: #475569;">${col.date || 'Trimestre ' + trimester}</td>
            <td style="font-size: 9.5px;">${catName}</td>
            <td style="text-align: center; font-family: monospace;">${col.maxScore ? col.maxScore.toFixed(1) : '5.0'}</td>
            <td style="text-align: center; font-family: monospace; font-weight: bold; color: ${
              isLow ? '#dc2626' : '#0f172a'
            }; background: ${isLow ? '#fef2f2' : 'transparent'};">
              ${scoreVal} ${isLow ? '⚠️' : ''}
            </td>
          </tr>
        `;
      }).join('');

      return `
        <div class="student-page">
          <!-- Official Institutional Header -->
          <div class="header">
            <div style="font-size: 11px; font-weight: bold; letter-spacing: 1px; color: #334155; text-transform: uppercase;">República de Panamá • Ministerio de Educación</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 1px;">Dirección Regional de Educación de ${teacherInfo.region || 'Panamá'} • ${teacherInfo.school || 'Centro Educativo'}</div>
            <h1 style="font-size: 15px; margin: 4px 0 2px 0; color: #0f172a; text-transform: uppercase;">
              Informe Individual de Calificaciones y Seguimiento a Padres
            </h1>
            <div style="font-size: 10px; font-weight: bold; color: #2563eb;">
              TRIMESTRE ${trimester} • AÑO LECTIVO 2026
            </div>
          </div>

          <!-- Student & Guardian Metadata Card -->
          <div class="meta-box">
            <div class="meta-row">
              <div><strong>Estudiante:</strong> <span style="text-transform: uppercase; font-weight: bold;">${student.lastName}, ${student.firstName}</span></div>
              <div><strong>N° de Lista:</strong> #${student.listNumber || (idx + 1)}</div>
              <div><strong>Cédula / Documento:</strong> ${student.documentId || student.cedula || 'S/N'}</div>
            </div>
            <div class="meta-row" style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
              <div><strong>Acudiente / Tutor:</strong> ${student.guardianName || 'Acudiente'}</div>
              <div><strong>Teléfono:</strong> ${student.guardianPhone || 'No registrado'}</div>
              <div><strong>Grupo / Nivel:</strong> ${group.name} (${group.grade || 'Secundaria'})</div>
            </div>
            <div class="meta-row" style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
              <div><strong>Asignatura:</strong> ${group.subject || 'Inglés'}</div>
              <div><strong>Docente:</strong> Prof. ${teacherInfo.name}</div>
              <div><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-PA', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>

          <!-- Alert Banner if Failing (< 3.0) or Congratulations if Honor (>= 4.5) -->
          ${
            isFailing
              ? `
              <div class="alert-box alert-danger">
                <div style="font-size: 11px; font-weight: bold; color: #991b1b;">
                  🚨 CITACIÓN Y ALERTA ACADÉMICA TEMPRANA (PROMEDIO MENOR A 3.0)
                </div>
                <div style="font-size: 9.5px; color: #7f1d1d; margin-top: 2px; line-height: 1.35;">
                  Estimado acudiente: El estudiante presenta un rendimiento <strong>DEFICIENTE (${formatGrade(calc.trimesterGrade)})</strong> en este período. Se requiere su apoyo inmediato en casa y su apersonamiento al plantel para coordinar el plan de recuperación pedagógica y firmar el compromiso adjunto.
                </div>
              </div>
            `
              : isHonor
              ? `
              <div class="alert-box alert-success">
                <div style="font-size: 11px; font-weight: bold; color: #166534;">
                  🌟 FELICITACIONES POR RENDIMIENTO SOBRESALIENTE
                </div>
                <div style="font-size: 9.5px; color: #14532d; margin-top: 2px;">
                  El estudiante ha demostrado excelente dedicación y esfuerzo con un promedio destacado de <strong>${formatGrade(calc.trimesterGrade)}</strong>.
                </div>
              </div>
            `
              : ''
          }

          <!-- Detailed Grade Matrix Table -->
          <div style="margin-bottom: 8px;">
            <div style="font-size: 10px; font-weight: bold; color: #1e293b; margin-bottom: 4px; text-transform: uppercase;">
              Desglose Detallado de Evaluaciones Realizadas:
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 25px;">#</th>
                  <th>Actividad / Evaluación</th>
                  <th style="width: 80px;">Fecha</th>
                  <th style="width: 170px;">Categoría MEDUCA</th>
                  <th style="width: 55px;">Puntaje</th>
                  <th style="width: 65px;">Nota</th>
                </tr>
              </thead>
              <tbody>
                ${
                  trimesterColumns.length > 0
                    ? evalRows
                    : `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 12px;">No hay evaluaciones registradas aún en este trimestre.</td></tr>`
                }
              </tbody>
            </table>
          </div>

          <!-- Summary & Averages Grid -->
          <div class="summary-grid">
            ${
              !isPrimary
                ? `
                <div class="stat-card">
                  <div class="stat-title">Apreciación (33%)</div>
                  <div class="stat-val">${calc.formativeAvg ? calc.formativeAvg.toFixed(1) : '—'}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-title">Parciales (33%)</div>
                  <div class="stat-val">${calc.summativeAvg ? calc.summativeAvg.toFixed(1) : '—'}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-title">Examen Trim. (34%)</div>
                  <div class="stat-val">${calc.examScore ? calc.examScore.toFixed(1) : '—'}</div>
                </div>
              `
                : `
                <div class="stat-card" style="grid-column: span 3;">
                  <div class="stat-title">Régimen Primaria: Promedio Parciales</div>
                  <div class="stat-val">${calc.summativeAvg ? calc.summativeAvg.toFixed(1) : '—'}</div>
                </div>
              `
            }
            <div class="stat-card stat-final ${isFailing ? 'stat-failing' : ''}">
              <div class="stat-title" style="color: ${isFailing ? '#991b1b' : '#1e3a8a'};">PROMEDIO TRIMESTRE ${trimester}</div>
              <div class="stat-val" style="color: ${isFailing ? '#dc2626' : '#1d4ed8'}; font-size: 16px;">
                ${formatGrade(calc.trimesterGrade)}
              </div>
              <div style="font-size: 9px; font-weight: bold; color: ${isFailing ? '#b91c1c' : '#15803d'}; text-transform: uppercase;">
                ${calc.statusLabel}
              </div>
            </div>
          </div>

          <!-- Attendance & Pedagogical Observations -->
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 8px; margin-bottom: 10px;">
            <div style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px; background: #f8fafc; font-size: 9.5px;">
              <div style="font-weight: bold; color: #1e293b; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
                📊 Asistencia y Puntualidad:
              </div>
              <div>• Presencias: <strong>${att?.present || 0}</strong></div>
              <div>• Ausencias Injustificadas: <strong style="color: ${(att?.absent || 0) > 2 ? '#dc2626' : 'inherit'};">${att?.absent || 0}</strong></div>
              <div>• Tardanzas: <strong>${att?.late || 0}</strong></div>
              <div>• Justificadas: <strong>${att?.justified || 0}</strong></div>
            </div>

            <div style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px; background: #f8fafc; font-size: 9.5px;">
              <div style="font-weight: bold; color: #1e293b; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
                📝 Observaciones y Recomendaciones Pedagógicas:
              </div>
              <div style="color: #334155; line-height: 1.35;">
                ${
                  obs ||
                  (isFailing
                    ? 'El estudiante debe reforzar el estudio diario, entregar puntualmente las asignaciones pendientes y acudir a las sesiones de recuperación.'
                    : 'Continúe con el buen hábito de estudio, la lectura comprensiva en inglés y la participación activa en clases.')
                }
              </div>
            </div>
          </div>

          <!-- Parent Commitment Section -->
          <div class="commitment-box">
            <div style="font-size: 10px; font-weight: bold; color: #0f172a; text-transform: uppercase; margin-bottom: 3px;">
              🤝 Acta de Compromiso del Acudiente y Seguimiento en el Hogar:
            </div>
            <div style="font-size: 9px; color: #475569; line-height: 1.3;">
              Yo, ________________________________________________, con cédula _____________________, acudiente del estudiante, me doy por enterado de las calificaciones registradas en el Trimestre ${trimester} y me comprometo a:<br/>
              [ &nbsp; ] Revisar diariamente cuadernos y asignaciones &nbsp;&nbsp;&nbsp; [ &nbsp; ] Apoyar el plan de recuperación pedagógica &nbsp;&nbsp;&nbsp; [ &nbsp; ] Atender citaciones del docente
            </div>
          </div>

          <!-- Signatures Section -->
          <div class="signatures-row">
            <div class="sig-field">
              ${
                teacherInfo.signatureDataUrl
                  ? `<img src="${teacherInfo.signatureDataUrl}" style="height:36px; max-width:140px; display:block; margin:0 auto;" />`
                  : '<div style="height:36px;"></div>'
              }
              <div style="font-weight: bold; color: #0f172a;">Prof. ${teacherInfo.name}</div>
              <div style="font-size: 8.5px; color: #64748b;">Docente de la Asignatura</div>
            </div>

            <div class="sig-field">
              <div style="height:36px;"></div>
              <div style="font-weight: bold; color: #0f172a;">Firma del Acudiente / Tutor</div>
              <div style="font-size: 8.5px; color: #64748b;">Cédula: ______________________</div>
            </div>

            <div class="sig-field">
              <div style="height:36px;"></div>
              <div style="font-weight: bold; color: #0f172a;">Dirección del Plantel</div>
              <div style="font-size: 8.5px; color: #64748b;">Firma y Sello Institucional</div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Boletas de Calificaciones y Seguimiento - ${group.name} (T${trimester})</title>
      <style>
        @page {
          size: letter portrait;
          margin: 10mm 12mm;
        }
        @media print {
          body { margin: 0; padding: 0; background: transparent; }
          .student-page {
            page-break-after: always;
            break-after: page;
            margin: 0;
            padding: 0;
            min-height: 98vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .no-print { display: none; }
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          color: #0f172a;
          line-height: 1.35;
          margin: 0;
          padding: 10px;
          background: #e2e8f0;
        }
        .student-page {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 16px 20px;
          margin-bottom: 20px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 6px;
          margin-bottom: 8px;
        }
        .meta-box {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 6px 10px;
          margin-bottom: 8px;
          font-size: 9.5px;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }
        .alert-box {
          border-radius: 4px;
          padding: 6px 10px;
          margin-bottom: 8px;
        }
        .alert-danger {
          background: #fef2f2;
          border: 1.5px solid #f87171;
        }
        .alert-success {
          background: #f0fdf4;
          border: 1.5px solid #4ade80;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 6px;
          font-size: 9.5px;
        }
        th, td {
          border: 1px solid #94a3b8;
          padding: 4.5px 6px;
          text-align: left;
        }
        th {
          background: #0f172a;
          color: #ffffff;
          text-align: center;
          text-transform: uppercase;
          font-size: 9px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 8px;
        }
        .stat-card {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 5px;
          text-align: center;
        }
        .stat-final {
          background: #eff6ff;
          border: 1.5px solid #93c5fd;
        }
        .stat-failing {
          background: #fef2f2;
          border: 1.5px solid #fca5a5;
        }
        .stat-title {
          font-size: 8.5px;
          font-weight: bold;
          color: #64748b;
          text-transform: uppercase;
        }
        .stat-val {
          font-size: 13px;
          font-weight: 900;
          font-family: monospace;
          color: #0f172a;
          margin-top: 1px;
        }
        .commitment-box {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 6px 10px;
          margin-bottom: 12px;
        }
        .signatures-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-top: 8px;
          page-break-inside: avoid;
        }
        .sig-field {
          text-align: center;
          flex: 1;
          border-top: 1px solid #475569;
          padding-top: 4px;
        }
      </style>
    </head>
    <body>
      ${studentPagesHTML}
    </body>
    </html>
  `;
  printHTMLSafely(
    fullHtml,
    options.specificStudentId
      ? `Boleta_Individual_${group.name}`
      : options.onlyFailing
      ? `Boletas_Reprobados_${group.name}`
      : `Boletas_Lote_${group.name}`
  );
}

