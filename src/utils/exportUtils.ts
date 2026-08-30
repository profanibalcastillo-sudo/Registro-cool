import {
  EvaluationColumn,
  Grade,
  Group,
  Student,
  TeacherProfile,
  ThemePlanner,
  WeeklyPlanner,
  TrimesterId,
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
  teacher: TeacherProfile,
  group: Group,
  planner: ThemePlanner
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const content = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Planificación Didáctica - MEDUCA</title>
      <style>
        @page { size: letter portrait; margin: 12mm; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.4; padding: 10px; }
        .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; margin-bottom: 12px; }
        h1 { font-size: 14px; margin: 0 0 6px 0; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
        th { background: #0f172a; color: #fff; text-align: center; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="box">
        <h1>MEDUCA • Planificación Curricular de Inglés por Competencias</h1>
        <p><strong>Docente:</strong> ${teacher.name} | <strong>Centro:</strong> ${teacher.schoolName || teacher.school} | <strong>Grupo:</strong> ${group.name}</p>
        <p><strong>Tema:</strong> ${planner.themeTitle} | <strong>Nivel:</strong> ${planner.cefrLevel}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 20%;">Habilidad</th>
            <th style="width: 40%;">Estándar Curricular</th>
            <th style="width: 40%;">Logro de Aprendizaje</th>
          </tr>
        </thead>
        <tbody>
          ${(planner.standardsAndOutcomes || []).map((so) => `
            <tr>
              <td><strong>${so.skillName}</strong></td>
              <td>${so.specificCurriculumStandard}</td>
              <td>${so.expectedLearningOutcome}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  printWindow.document.write(content);
  printWindow.document.close();
}

export function exportWeeklyPlannerToHTML(
  teacher: TeacherProfile,
  group: Group,
  planner: WeeklyPlanner
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const content = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Secuencia Didáctica Semanal - MEDUCA</title>
      <style>
        @page { size: letter landscape; margin: 12mm; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 10px; }
        .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px; }
        th { background: #0f172a; color: #fff; text-align: center; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="box">
        <h2 style="margin:0 0 4px 0;">MEDUCA • Secuencia Didáctica Semanal (Semana ${planner.weekNumber})</h2>
        <p style="margin:0;"><strong>Docente:</strong> ${teacher.name} | <strong>Grupo:</strong> ${group.name} | <strong>Rango:</strong> ${planner.datesRange || 'Año 2026'}</p>
        <p style="margin:4px 0 0 0;"><strong>Tema / Área:</strong> ${planner.topic} (${planner.area})</p>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:33%;">Actividades de Inicio</th>
            <th style="width:34%;">Actividades de Desarrollo</th>
            <th style="width:33%;">Actividades de Cierre</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${planner.learningActivities?.start || ''}</td>
            <td>${planner.learningActivities?.development || ''}</td>
            <td>${planner.learningActivities?.closure || ''}</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;
  printWindow.document.write(content);
  printWindow.document.close();
}
