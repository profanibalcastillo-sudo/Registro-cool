export type TrimesterId = 1 | 2 | 3;

export type EvaluationCategory =
  | 'actividades'
  | 'cotidianas'
  | 'apreciacion'
  | 'examen'
  | 'formative'
  | 'summative'
  | 'exam';

export interface TeacherProfile {
  name: string;
  title: string;
  email: string;
  phone: string;
  schoolName: string;
  school?: string;
  circuit: string;
  region: string;
  academicYear: number;
  subject: string;
  shift: 'Matutino' | 'Vespertino' | 'Completa';
  avatarUrl?: string;
  signatureDataUrl?: string;
}

export interface Student {
  id: string;
  groupId: string;
  listNumber: number;
  cedula: string;
  documentId?: string;
  lastName: string;
  firstName: string;
  gender: 'M' | 'F';
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  status: 'Activo' | 'Retirado' | 'Trasladado';
  active?: boolean;
  notes?: string;
  createdAt?: string;
}

export interface EvaluationActivity {
  id: string;
  groupId: string;
  trimester: TrimesterId | number;
  category?: EvaluationCategory | string;
  title: string;
  description?: string;
  date: string;
  maxScore: number; // usually 5.0
  weight?: number;
  createdAt?: string;
}

export type EvaluationColumn = EvaluationActivity;

export interface GradeEntry {
  id?: string;
  studentId: string;
  activityId?: string;
  columnId?: string;
  score: number | null; // 1.0 - 5.0
  notes?: string;
  updatedAt?: string;
}

export type Grade = GradeEntry;

export type AttendanceStatus =
  | 'P'
  | 'A'
  | 'J'
  | 'T'
  | 'present'
  | 'absent'
  | 'late'
  | 'justified'
  | 'unrecorded';

export interface AttendanceRecord {
  id: string;
  groupId: string;
  studentId?: string;
  date: string; // YYYY-MM-DD
  status?: AttendanceStatus;
  records?: Record<string, AttendanceStatus>; // studentId -> status
  topicCovered?: string;
  notes?: string;
  periodNumber?: number;
  createdAt?: string;
}

export interface BehaviorIncident {
  id: string;
  studentId: string;
  groupId: string;
  date: string;
  trimester: TrimesterId | number;
  type: 'Felicitación' | 'Llamado Verbal' | 'Falta Leve' | 'Falta Grave' | 'Citación a Acudiente';
  title: string;
  description: string;
  actionTaken: string;
  status: 'Abierto' | 'Resuelto' | 'En Seguimiento';
}

export interface WeeklyPlanner {
  id: string;
  groupId: string;
  trimester: TrimesterId | number;
  weekNumber: number;
  datesRange: string;
  topic: string;
  area: string;
  weeklyHours: number;
  fundamentalCompetencies: string;
  learningAchievements: string;
  learningActivities: {
    start: string;
    development: string;
    closure: string;
  };
  evaluationCriteria: string;
  didacticResources: string;
  status?: 'Planificado' | 'En Curso' | 'Finalizado';
}

export type LessonPlan = WeeklyPlanner;

export type EflSkill = 'listening' | 'reading' | 'speaking' | 'writing' | 'mediation';

export interface LessonStage {
  stageNumber: number; // 1 to 6
  name: string;
  shortName: string;
  durationMinutes: number;
  description: string;
  neuroscienceInsight: {
    title: string;
    description: string;
  };
}

export interface SkillLessonPlan {
  id: string;
  skill: EflSkill;
  lessonNumber: number; // 1 to 5
  skillTitle: string;
  specificObjective: string;
  learningOutcome: string;
  totalTimeMinutes: number;
  stages: LessonStage[];
  formativeAssessmentStrategy: string;
  reinforcementHomework: string;
  teacherReflection?: string;
}

export interface ThemeStandardOutcome {
  skill: EflSkill;
  skillName: string;
  specificCurriculumStandard: string;
  expectedLearningOutcome: string;
}

export interface ThemeCompetences {
  linguistic: {
    grammar: string;
    vocabulary: string;
    phonetics: string;
  };
  pragmatic: {
    communicativeFunctions: string;
  };
  sociolinguistic: {
    socioCulturalAspects: string;
  };
}

export interface ThemePlanner {
  id: string;
  groupId: string;
  trimester: TrimesterId | number;
  themeNumber: number;
  scenario: string;
  themeTitle: string;
  cefrLevel: string;
  gradeLevel: string;
  weeklyPeriods: number;
  weeksRange: string;
  schoolYear: number;
  standardsAndOutcomes: ThemeStandardOutcome[];
  competences: ThemeCompetences;
  unitProject: {
    title: string;
    description: string;
  };
  materialsAndResources: string;
  differentiatedInstruction: string;
  status: 'Planificado' | 'En Curso' | 'Finalizado';
  lessons: SkillLessonPlan[];
}

export interface Group {
  id: string;
  name: string;
  gradeLevel?: string;
  grade?: string;
  subject?: string;
  educationLevel?: 'Primaria' | 'Premedia' | 'Media';
  track?: string; // e.g., 'Ciencias', 'Humanidades', 'Comercio', 'General', 'Informática', 'Turismo'
  academicYear?: number;
  shift?: 'Matutino' | 'Vespertino' | 'Completa';
  roomNumber?: string;
  studentsCount?: number;
  studentCount?: number;
  colorTag?: string;
  description?: string;
}

export interface CategoryWeights {
  apreciacion?: number;
  cotidianas?: number;
  examen?: number;
  actividades?: number;
  formative?: number;
  summative?: number;
}

export interface StudentSummaryGrade {
  studentId: string;
  activitiesCount: number;
  activitiesAvg: number | null;
  apreciacionAvg?: number | null;
  formativeAvg?: number;
  summativeAvg?: number;
  examScore?: number;
  cotidianasAvg?: number | null;
  examenGrade?: number | null;
  trimesterGrade: number | null;
  finalGrade?: number;
  trimester1Grade?: number | null;
  trimester2Grade?: number | null;
  trimester3Grade?: number | null;
  t1Grade?: number;
  t2Grade?: number;
  t3Grade?: number;
  annualAverage?: number;
  finalAnnualGrade?: number | null;
  formattedGrade?: string;
  isPassing: boolean;
  isFailing?: boolean;
  statusLabel: 'Excelente' | 'Bueno' | 'Regular' | 'Deficiente' | 'Sin Calificar';
}

export interface TrimesterPeriodDates {
  number?: number;
  name?: string;
  startDate: string;
  endDate: string;
  recessStartDate?: string;
  recessEndDate?: string;
  notes?: string;
}

export interface AcademicCalendarConfig {
  schoolYear: number;
  year?: number;
  trimesters: TrimesterPeriodDates[];
  trimester1?: TrimesterPeriodDates;
  trimester2?: TrimesterPeriodDates;
  trimester3?: TrimesterPeriodDates;
}

export type AcademicCalendar = AcademicCalendarConfig;

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface SchedulePeriod {
  periodNumber: number;
  name?: string;
  label?: string;
  startTime: string;
  endTime: string;
  isRecess?: boolean;
  afterBreak?: {
    label: string;
    durationMinutes: number;
    startTime: string;
    endTime: string;
  };
}

export type SchedulePeriodConfig = SchedulePeriod;

export interface ScheduleSlot {
  id: string;
  day?: DayOfWeek;
  dayOfWeek?: string;
  periodNumber: number;
  groupId?: string;
  groupName?: string;
  customGroupLabel?: string;
  subject: string;
  room?: string;
  classroom?: string;
  color?: string;
  notes?: string;
}

export interface ScheduleSettings {
  alarmEnabled: boolean;
  alarmVolume: number;
  preAlarmMinutes: number;
  soundType: 'school_bell' | 'chime' | 'digital_gong' | 'marimba';
  notificationsEnabled: boolean;
}

export interface CurrentPeriodInfo {
  isSchoolHours: boolean;
  period: SchedulePeriod | null;
  timeRemaining: string | null;
  minutesRemaining: number | null;
}

export interface SystemBackupData {
  version: string;
  timestamp: string;
  app: string;
  exportedBy?: string;
  groups: Group[];
  students: Student[];
  evaluationColumns: EvaluationColumn[];
  grades: Record<string, Grade>;
  attendanceRecords: Record<string, AttendanceRecord>;
  themePlanners: ThemePlanner[];
  weeklyPlanners: WeeklyPlanner[];
  scheduleSlots: ScheduleSlot[];
  schedulePeriods: SchedulePeriod[];
  calendarConfig: AcademicCalendarConfig;
  teacherInfo: TeacherProfile;
}

export interface LocalSnapshot {
  id: string;
  label: string;
  createdAt: string;
  itemCounts: {
    groups: number;
    students: number;
    grades: number;
    attendance: number;
    planners: number;
  };
  data: SystemBackupData;
}
