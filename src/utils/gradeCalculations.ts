import {
  CategoryWeights,
  EvaluationActivity,
  EvaluationColumn,
  GradeEntry,
  Grade,
  Group,
  Student,
  StudentSummaryGrade,
  TrimesterId,
} from '../types';

export const DEFAULT_WEIGHTS: CategoryWeights = {
  actividades: 100,
  formative: 33,
  summative: 33,
  examen: 34,
};

export const MIN_PASSING_GRADE = 3.0;

/**
 * Checks if a group or level belongs to MEDUCA Primary Education (1° to 6° Grado).
 * In Panama MEDUCA Primaria, only partial grades are used (no appreciation/formative weights, no trimestral exams).
 */
export function isPrimaryEducation(levelOrGroup?: any): boolean {
  if (!levelOrGroup) return false;
  if (typeof levelOrGroup === 'string') {
    const s = levelOrGroup.toLowerCase();
    return s.includes('primaria') || s.includes('elementary') || /^[1-6][°º]/.test(s) || /^[1-6](to|ro|do|er|to|mo)/.test(s);
  }
  const level = (levelOrGroup.educationLevel || '').toLowerCase();
  const grade = (levelOrGroup.grade || levelOrGroup.gradeLevel || '').toLowerCase();
  const name = (levelOrGroup.name || '').toLowerCase();
  const track = (levelOrGroup.track || '').toLowerCase();
  return (
    level.includes('primaria') ||
    level.includes('elementary') ||
    track.includes('primaria') ||
    grade.includes('1°') || grade.includes('2°') || grade.includes('3°') ||
    grade.includes('4°') || grade.includes('5°') || grade.includes('6°') ||
    name.includes('primaria') ||
    /^[1-6][°º]/.test(grade) ||
    /^[1-6][°º]/.test(name)
  );
}

export function formatGrade(grade: number | null | undefined): string {
  if (grade === null || grade === undefined || isNaN(grade) || grade === 0) {
    return '—';
  }
  return grade.toFixed(1);
}

export function getGradeStatus(grade: number | null | undefined): {
  label: 'Excelente' | 'Bueno' | 'Regular' | 'Deficiente' | 'Sin Calificar';
  color: string;
  bgLight: string;
  badgeClass: string;
} {
  if (grade === null || grade === undefined || isNaN(grade) || grade === 0) {
    return {
      label: 'Sin Calificar',
      color: 'text-zinc-500',
      bgLight: 'bg-zinc-100',
      badgeClass: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
    };
  }
  if (grade >= 4.6) {
    return {
      label: 'Excelente',
      color: 'text-emerald-700',
      bgLight: 'bg-emerald-50',
      badgeClass: 'bg-emerald-100/80 text-emerald-800 border border-emerald-300 font-semibold',
    };
  } else if (grade >= 4.0) {
    return {
      label: 'Bueno',
      color: 'text-blue-700',
      bgLight: 'bg-blue-50',
      badgeClass: 'bg-blue-100/80 text-blue-800 border border-blue-300 font-medium',
    };
  } else if (grade >= 3.0) {
    return {
      label: 'Regular',
      color: 'text-amber-700',
      bgLight: 'bg-amber-50',
      badgeClass: 'bg-amber-100/80 text-amber-800 border border-amber-300 font-medium',
    };
  } else {
    return {
      label: 'Deficiente',
      color: 'text-rose-700',
      bgLight: 'bg-rose-50',
      badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold',
    };
  }
}

function normalizeGrades(grades: GradeEntry[] | Grade[] | Record<string, GradeEntry | Grade> | undefined | null): (GradeEntry | Grade)[] {
  if (!grades) return [];
  if (Array.isArray(grades)) return grades;
  if (typeof grades === 'object') return Object.values(grades);
  return [];
}

function normalizeActivities(activities: EvaluationActivity[] | EvaluationColumn[] | Record<string, EvaluationActivity | EvaluationColumn> | undefined | null): (EvaluationActivity | EvaluationColumn)[] {
  if (!activities) return [];
  if (Array.isArray(activities)) return activities;
  if (typeof activities === 'object') return Object.values(activities);
  return [];
}

export function calculateStudentTrimesterSummary(
  studentOrId: string | Student,
  arg2: any,
  arg3: any,
  arg4?: any,
  _weights: CategoryWeights = DEFAULT_WEIGHTS,
  isPrimary?: boolean
): StudentSummaryGrade {
  const studentId = typeof studentOrId === 'string' ? studentOrId : studentOrId?.id || '';

  // Handle signature overload: (studentId, activities, grades, trimester) VS (studentId, trimester, activities, grades)
  let activitiesInput: any;
  let gradesInput: any;
  let trimesterInput: number = 1;

  if (typeof arg2 === 'number') {
    // Overload: (studentId, trimester, activities, grades)
    trimesterInput = arg2;
    activitiesInput = arg3;
    gradesInput = arg4;
  } else {
    // Standard: (studentId, activities, grades, trimester)
    activitiesInput = arg2;
    gradesInput = arg3;
    trimesterInput = typeof arg4 === 'number' ? arg4 : 1;
  }

  const activities = normalizeActivities(activitiesInput);
  const gradesArray = normalizeGrades(gradesInput);

  const trimesterActivities = activities.filter((a) => Number(a.trimester) === Number(trimesterInput));
  const actIds = new Set(trimesterActivities.map((a) => a.id));

  const studentGrades = gradesArray.filter((g) => {
    const actId = (g as any).activityId || (g as any).columnId;
    return g.studentId === studentId && actId && actIds.has(actId) && g.score !== null && !isNaN(g.score) && g.score > 0;
  });

  // Calculate by category
  const formativeActs = trimesterActivities.filter((a) => a.category === 'formative');
  const summativeActs = trimesterActivities.filter((a) => a.category === 'summative');
  const examActs = trimesterActivities.filter((a) => a.category === 'exam');

  const getAvgForActs = (acts: (EvaluationActivity | EvaluationColumn)[]): number | null => {
    const ids = new Set(acts.map((a) => a.id));
    const scores = studentGrades
      .filter((g) => {
        const actId = (g as any).activityId || (g as any).columnId;
        return actId && ids.has(actId);
      })
      .map((g) => g.score as number);
    if (scores.length === 0) return null;
    return Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
  };

  const formativeAvg = getAvgForActs(formativeActs);
  const summativeAvg = getAvgForActs(summativeActs);
  const examScore = getAvgForActs(examActs);

  let trimesterGrade: number | null = null;
  const validScores = studentGrades.map((g) => g.score as number);

  // Check if Primaria mode applies:
  // In MEDUCA Primaria: strictly direct arithmetic average of all partial scores (no appreciation, no exams)
  const isPrimariaRegime = isPrimary === true || (formativeActs.length === 0 && examActs.length === 0);

  if (isPrimariaRegime) {
    // Primaria: Direct arithmetic mean of all partial evaluations
    if (validScores.length > 0) {
      const sum = validScores.reduce((acc, curr) => acc + curr, 0);
      trimesterGrade = Number((sum / validScores.length).toFixed(1));
    }
  } else {
    // Premedia & Media: 33% Formativa/Apreciación, 33% Sumativa/Parciales, 34% Examen Trimestral
    if (formativeAvg !== null || summativeAvg !== null || examScore !== null) {
      let weightedSum = 0;
      let totalWeight = 0;

      if (formativeAvg !== null) {
        weightedSum += formativeAvg * 0.33;
        totalWeight += 0.33;
      }
      if (summativeAvg !== null) {
        weightedSum += summativeAvg * 0.33;
        totalWeight += 0.33;
      }
      if (examScore !== null) {
        weightedSum += examScore * 0.34;
        totalWeight += 0.34;
      }

      if (totalWeight > 0) {
        trimesterGrade = Number((weightedSum / totalWeight).toFixed(1));
      }
    } else if (validScores.length > 0) {
      const sum = validScores.reduce((acc, curr) => acc + curr, 0);
      trimesterGrade = Number((sum / validScores.length).toFixed(1));
    }
  }

  const isPassing = trimesterGrade !== null ? trimesterGrade >= MIN_PASSING_GRADE : true;
  const status = getGradeStatus(trimesterGrade);

  return {
    studentId,
    activitiesCount: validScores.length,
    activitiesAvg: trimesterGrade,
    apreciacionAvg: isPrimariaRegime ? null : formativeAvg,
    formativeAvg: isPrimariaRegime ? 0 : (formativeAvg ?? 0),
    summativeAvg: summativeAvg ?? (validScores.length > 0 ? Number((validScores.reduce((a,b)=>a+b,0)/validScores.length).toFixed(2)) : 0),
    examScore: isPrimariaRegime ? 0 : (examScore ?? 0),
    cotidianasAvg: summativeAvg,
    examenGrade: isPrimariaRegime ? null : examScore,
    trimesterGrade,
    finalGrade: trimesterGrade ?? 0,
    formattedGrade: formatGrade(trimesterGrade),
    isPassing,
    isFailing: trimesterGrade !== null ? trimesterGrade < MIN_PASSING_GRADE : false,
    statusLabel: status.label,
  };
}

export const calculateStudentTrimesterGrade = calculateStudentTrimesterSummary;

export function calculateGroupStatistics(
  students: Student[],
  arg2: any,
  arg3: any,
  arg4?: any,
  isPrimary?: boolean
) {
  let activitiesInput: any;
  let gradesInput: any;
  let trimesterInput: number = 1;

  if (typeof arg2 === 'number') {
    trimesterInput = arg2;
    activitiesInput = arg3;
    gradesInput = arg4;
  } else {
    activitiesInput = arg2;
    gradesInput = arg3;
    trimesterInput = typeof arg4 === 'number' ? arg4 : 1;
  }

  const safeStudents = Array.isArray(students) ? students : [];
  const summaries = safeStudents.map((s) =>
    calculateStudentTrimesterSummary(s.id, activitiesInput, gradesInput, trimesterInput, DEFAULT_WEIGHTS, isPrimary)
  );

  const totalStudents = safeStudents.length;
  const graded = summaries.filter((s) => s.trimesterGrade !== null && (s.trimesterGrade || 0) > 0);
  const totalGraded = graded.length;

  if (totalGraded === 0) {
    return {
      totalStudents,
      passedStudents: 0,
      failedStudents: 0,
      passPercentage: 0,
      averageGrade: 0,
      groupAverage: 0,
      average: 0,
      passingCount: 0,
      failingCount: 0,
      passingRate: 0,
      highestGrade: 0,
      lowestGrade: 0,
    };
  }

  const sum = graded.reduce((acc, s) => acc + (s.trimesterGrade || 0), 0);
  const average = Number((sum / totalGraded).toFixed(2));
  const passingCount = graded.filter((s) => s.isPassing).length;
  const failingCount = totalGraded - passingCount;
  const passingRate = Math.round((passingCount / totalGraded) * 100);
  const gradesList = graded.map((s) => s.trimesterGrade || 0);
  const highestGrade = Math.max(...gradesList);
  const lowestGrade = Math.min(...gradesList);

  return {
    totalStudents,
    passedStudents: passingCount,
    failedStudents: failingCount,
    passPercentage: passingRate,
    averageGrade: average,
    groupAverage: average,
    average,
    passingCount,
    failingCount,
    passingRate,
    highestGrade,
    lowestGrade,
  };
}

export function calculateStudentAnnualSummary(
  studentOrId: string | Student,
  activitiesInput: any,
  gradesInput: any,
  weights: CategoryWeights = DEFAULT_WEIGHTS,
  isPrimary?: boolean
): StudentSummaryGrade {
  const studentId = typeof studentOrId === 'string' ? studentOrId : studentOrId?.id || '';

  const t1 = calculateStudentTrimesterSummary(studentId, activitiesInput, gradesInput, 1, weights, isPrimary).trimesterGrade;
  const t2 = calculateStudentTrimesterSummary(studentId, activitiesInput, gradesInput, 2, weights, isPrimary).trimesterGrade;
  const t3 = calculateStudentTrimesterSummary(studentId, activitiesInput, gradesInput, 3, weights, isPrimary).trimesterGrade;

  const validTrimesters = [t1, t2, t3].filter((t): t is number => t !== null && !isNaN(t) && t > 0);
  let finalAnnualGrade: number | null = null;

  if (validTrimesters.length > 0) {
    const sum = validTrimesters.reduce((acc, curr) => acc + curr, 0);
    finalAnnualGrade = Number((sum / validTrimesters.length).toFixed(1));
  }

  const status = getGradeStatus(finalAnnualGrade);

  return {
    studentId,
    activitiesCount: validTrimesters.length,
    activitiesAvg: finalAnnualGrade,
    apreciacionAvg: null,
    cotidianasAvg: null,
    examenGrade: null,
    trimesterGrade: null,
    trimester1Grade: t1,
    trimester2Grade: t2,
    trimester3Grade: t3,
    t1Grade: t1 ?? 0,
    t2Grade: t2 ?? 0,
    t3Grade: t3 ?? 0,
    annualAverage: finalAnnualGrade ?? 0,
    finalAnnualGrade,
    finalGrade: finalAnnualGrade ?? 0,
    formattedGrade: formatGrade(finalAnnualGrade),
    isPassing: finalAnnualGrade !== null ? finalAnnualGrade >= MIN_PASSING_GRADE : true,
    isFailing: finalAnnualGrade !== null ? finalAnnualGrade < MIN_PASSING_GRADE : false,
    statusLabel: status.label,
  };
}

