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

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permita ventanas emergentes para generar el reporte de impresión.');
    return;
  }

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

  printWindow.document.write(`
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
    <body onload="window.print()">
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
  `);
  printWindow.document.close();
}

export function exportThemePlannerToHTML(
  teacher: TeacherProfile | { name: string; email: string; school?: string; schoolName?: string; region?: string; signatureDataUrl?: string },
  group: Group,
  planner: ThemePlanner
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permita ventanas emergentes o use la opción de imprimir.');
    return;
  }

  const schoolName = (teacher as any).schoolName || (teacher as any).school || 'Colegio Secundario';
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
  printWindow.document.write(content);
  printWindow.document.close();
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
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permita ventanas emergentes o use la opción de imprimir.');
    return;
  }

  const schoolName = (teacher as any).schoolName || (teacher as any).school || 'Colegio Secundario';
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
  printWindow.document.write(content);
  printWindow.document.close();
}

export function exportWeeklyPlannerToHTML(
  teacher: TeacherProfile | { name: string; email: string; school?: string; schoolName?: string; region?: string; signatureDataUrl?: string },
  group: Group,
  planner: WeeklyPlanner
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permita ventanas emergentes para generar el reporte de impresión.');
    return;
  }

  const schoolName = (teacher as any).schoolName || (teacher as any).school || 'Colegio Secundario';
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
    <body onload="window.print()">
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
  printWindow.document.write(content);
  printWindow.document.close();
}
