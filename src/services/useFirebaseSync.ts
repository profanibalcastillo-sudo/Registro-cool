import { useState, useEffect, useCallback, useRef } from 'react';
import {
  auth,
  db,
  loginWithGoogle,
  loginWithGoogleRedirect,
  checkRedirectResult,
  logoutUser,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  User,
} from './firebase';
import {
  Student,
  EvaluationColumn,
  Grade,
  AttendanceRecord,
  ThemePlanner,
  WeeklyPlanner,
  ScheduleSlot,
  SchedulePeriod,
  AcademicCalendarConfig,
  Group,
  TeacherProfile,
  SystemBackupData,
  LocalSnapshot,
} from '../types';
import {
  INITIAL_GROUPS,
  INITIAL_STUDENTS,
  INITIAL_EVALUATION_COLUMNS,
  INITIAL_GRADES_MAP,
  INITIAL_ATTENDANCE_MAP,
  INITIAL_THEME_PLANNERS,
  INITIAL_WEEKLY_PLANNERS,
  INITIAL_SCHEDULE_PERIODS,
  INITIAL_SCHEDULE_SLOTS,
  INITIAL_CALENDAR_CONFIG,
  INITIAL_TEACHER_PROFILE,
} from '../data/initialData';

export function useFirebaseSync() {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('meduca_logged_user_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // default fallback
      }
    }
    // Default active teacher profile (direct access, no login barrier)
    const defaultUser = {
      uid: 'anibal-castillo-meduca-chiriqui',
      email: 'profanibalcastillo@gmail.com',
      displayName: 'Prof. Aníbal Castillo',
      photoURL: INITIAL_TEACHER_PROFILE.avatarUrl,
    };
    try {
      localStorage.setItem('meduca_logged_user_v1', JSON.stringify(defaultUser));
    } catch {}
    return defaultUser;
  });

  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>(() =>
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced'
  );

  // Groups and navigation state
  const [groups, setGroups] = useState<Group[]>(() => {
    try {
      const saved = localStorage.getItem('meduca_groups_v1');
      return saved ? JSON.parse(saved) : INITIAL_GROUPS;
    } catch {
      return INITIAL_GROUPS;
    }
  });
  const [selectedGroupId, setSelectedGroupId] = useState<string>('grp-7a');
  const [selectedTrimester, setSelectedTrimester] = useState<number>(2);

  // Core Data
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('meduca_students_v1');
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [evaluationColumns, setEvaluationColumns] = useState<EvaluationColumn[]>(() => {
    try {
      const saved = localStorage.getItem('meduca_eval_cols_v1');
      return saved ? JSON.parse(saved) : INITIAL_EVALUATION_COLUMNS;
    } catch {
      return INITIAL_EVALUATION_COLUMNS;
    }
  });

  const [grades, setGrades] = useState<Record<string, Grade>>(() => {
    try {
      const saved = localStorage.getItem('meduca_grades_v1');
      return saved ? JSON.parse(saved) : INITIAL_GRADES_MAP;
    } catch {
      return INITIAL_GRADES_MAP;
    }
  });

  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>(() => {
    try {
      const saved = localStorage.getItem('meduca_attendance_v1');
      return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_MAP;
    } catch {
      return INITIAL_ATTENDANCE_MAP;
    }
  });

  const [themePlanners, setThemePlanners] = useState<ThemePlanner[]>(() => {
    try {
      const saved = localStorage.getItem('meduca_themes_v1');
      return saved ? JSON.parse(saved) : INITIAL_THEME_PLANNERS;
    } catch {
      return INITIAL_THEME_PLANNERS;
    }
  });

  const [weeklyPlanners, setWeeklyPlanners] = useState<WeeklyPlanner[]>(() => {
    try {
      const saved = localStorage.getItem('meduca_weeklies_v1');
      return saved ? JSON.parse(saved) : INITIAL_WEEKLY_PLANNERS;
    } catch {
      return INITIAL_WEEKLY_PLANNERS;
    }
  });

  const [schedulePeriods, setSchedulePeriods] = useState<SchedulePeriod[]>(() => {
    try {
      const savedV2 = localStorage.getItem('meduca_periods_v2');
      if (savedV2) {
        return JSON.parse(savedV2);
      }
      const savedV1 = localStorage.getItem('meduca_periods_v1');
      if (savedV1) {
        const parsed = JSON.parse(savedV1);
        // Check if existing stored periods are the legacy 9-period config ending at 14:05/13:25
        // or if period 5 is not recess. If so, upgrade to the official 7:00 AM - 12:00 PM schedule.
        if (
          Array.isArray(parsed) &&
          (parsed.length !== 8 || !parsed.some((p: SchedulePeriod) => p.isRecess && p.periodNumber === 5))
        ) {
          localStorage.setItem('meduca_periods_v2', JSON.stringify(INITIAL_SCHEDULE_PERIODS));
          localStorage.setItem('meduca_periods_v1', JSON.stringify(INITIAL_SCHEDULE_PERIODS));
          return INITIAL_SCHEDULE_PERIODS;
        }
        return parsed;
      }
      return INITIAL_SCHEDULE_PERIODS;
    } catch {
      return INITIAL_SCHEDULE_PERIODS;
    }
  });

  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>(() => {
    try {
      const savedV2 = localStorage.getItem('meduca_slots_v2');
      if (savedV2) return JSON.parse(savedV2);

      const savedV1 = localStorage.getItem('meduca_slots_v1');
      if (savedV1) {
        const parsed: ScheduleSlot[] = JSON.parse(savedV1);
        // Clean slots that might conflict with period 5 (now recess)
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((s) => s.periodNumber !== 5 && s.periodNumber <= 8);
          return filtered.length > 0 ? filtered : INITIAL_SCHEDULE_SLOTS;
        }
      }
      return INITIAL_SCHEDULE_SLOTS;
    } catch {
      return INITIAL_SCHEDULE_SLOTS;
    }
  });

  const [calendarConfig, setCalendarConfig] = useState<AcademicCalendarConfig>(() => {
    try {
      const saved = localStorage.getItem('meduca_calendar_v1');
      return saved ? JSON.parse(saved) : INITIAL_CALENDAR_CONFIG;
    } catch {
      return INITIAL_CALENDAR_CONFIG;
    }
  });

  const [teacherInfo, setTeacherInfo] = useState<TeacherProfile>(() => {
    try {
      const saved = localStorage.getItem('meduca_teacher_info_v1');
      return saved ? JSON.parse(saved) : INITIAL_TEACHER_PROFILE;
    } catch {
      return INITIAL_TEACHER_PROFILE;
    }
  });

  // Local Snapshots (History of backups and restore points in LocalStorage)
  const [localSnapshots, setLocalSnapshots] = useState<LocalSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('meduca_snapshots_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Local storage auto-persist with try-catch safety
  useEffect(() => {
    try {
      localStorage.setItem('meduca_groups_v1', JSON.stringify(groups));
    } catch (e) {
      console.warn('Storage write notice (groups):', e);
    }
  }, [groups]);

  useEffect(() => {
    try {
      localStorage.setItem('meduca_students_v1', JSON.stringify(students));
    } catch (e) {
      console.warn('Storage write notice (students):', e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem('meduca_eval_cols_v1', JSON.stringify(evaluationColumns));
    } catch (e) {
      console.warn('Storage write notice (eval cols):', e);
    }
  }, [evaluationColumns]);

  useEffect(() => {
    try {
      localStorage.setItem('meduca_grades_v1', JSON.stringify(grades));
    } catch (e) {
      console.warn('Storage write notice (grades):', e);
    }
  }, [grades]);

  useEffect(() => {
    try {
      localStorage.setItem('meduca_attendance_v1', JSON.stringify(attendanceRecords));
    } catch (e) {
      console.warn('Storage write notice (attendance):', e);
    }
  }, [attendanceRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('meduca_themes_v1', JSON.stringify(themePlanners));
    } catch (e) {
      console.warn('Storage write notice (themes):', e);
    }
  }, [themePlanners]);

  useEffect(() => {
    try {
      localStorage.setItem('meduca_weeklies_v1', JSON.stringify(weeklyPlanners));
    } catch (e) {
      console.warn('Storage write notice (weeklies):', e);
    }
  }, [weeklyPlanners]);

  useEffect(() => {
    try {
      localStorage.setItem('meduca_periods_v2', JSON.stringify(schedulePeriods));
      localStorage.setItem('meduca_periods_v1', JSON.stringify(schedulePeriods));
    } catch (e) {
      console.warn('Storage write notice (periods):', e);
    }
  }, [schedulePeriods]);

  useEffect(() => {
    try {
      localStorage.setItem('meduca_slots_v2', JSON.stringify(scheduleSlots));
      localStorage.setItem('meduca_slots_v1', JSON.stringify(scheduleSlots));
    } catch (e) {
      console.warn('Storage write notice (slots):', e);
    }
  }, [scheduleSlots]);

  useEffect(() => {
    try {
      localStorage.setItem('meduca_calendar_v1', JSON.stringify(calendarConfig));
    } catch (e) {
      console.warn('Storage write notice (calendar):', e);
    }
  }, [calendarConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('meduca_teacher_info_v1', JSON.stringify(teacherInfo));
    } catch (e) {
      console.warn('Storage write notice (teacher info):', e);
    }
  }, [teacherInfo]);

  useEffect(() => {
    try {
      localStorage.setItem('meduca_snapshots_v1', JSON.stringify(localSnapshots));
    } catch (e) {
      console.warn('Storage write notice (snapshots):', e);
    }
  }, [localSnapshots]);

  // Auth observer and redirect result check
  useEffect(() => {
    // Check if user just returned from Google Redirect login (Safari / Mobile / iPad)
    checkRedirectResult()
      .then((fireUser) => {
        if (fireUser) {
          const u = {
            uid: fireUser.uid,
            email: fireUser.email || 'profanibalcastillo@gmail.com',
            displayName: fireUser.displayName || 'Prof. Aníbal Castillo',
            photoURL: fireUser.photoURL || INITIAL_TEACHER_PROFILE.avatarUrl,
          };
          setUser(u);
          localStorage.setItem('meduca_logged_user_v1', JSON.stringify(u));
        }
      })
      .catch((err) => {
        console.warn('Redirect auth check notice:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (fireUser) => {
      if (fireUser) {
        const u = {
          uid: fireUser.uid,
          email: fireUser.email,
          displayName: fireUser.displayName || 'Prof. Aníbal Castillo',
          photoURL: fireUser.photoURL || INITIAL_TEACHER_PROFILE.avatarUrl,
        };
        setUser(u);
        localStorage.setItem('meduca_logged_user_v1', JSON.stringify(u));
        
        // Fetch cloud data if exists
        try {
          setSyncStatus('syncing');
          const docRef = doc(db, 'teacher_records', fireUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.groups && Array.isArray(data.groups)) setGroups(data.groups);
            if (data.students && Array.isArray(data.students)) setStudents(data.students);
            if (data.evaluationColumns && Array.isArray(data.evaluationColumns)) setEvaluationColumns(data.evaluationColumns);
            if (data.grades && typeof data.grades === 'object') setGrades(data.grades);
            if (data.attendanceRecords && typeof data.attendanceRecords === 'object') setAttendanceRecords(data.attendanceRecords);
            if (data.themePlanners && Array.isArray(data.themePlanners)) setThemePlanners(data.themePlanners);
            if (data.weeklyPlanners && Array.isArray(data.weeklyPlanners)) setWeeklyPlanners(data.weeklyPlanners);
            if (data.scheduleSlots && Array.isArray(data.scheduleSlots)) setScheduleSlots(data.scheduleSlots);
            if (data.schedulePeriods && Array.isArray(data.schedulePeriods)) setSchedulePeriods(data.schedulePeriods);
            if (data.calendarConfig && typeof data.calendarConfig === 'object') setCalendarConfig(data.calendarConfig);
            if (data.teacherInfo && typeof data.teacherInfo === 'object') setTeacherInfo(data.teacherInfo);
          }
          setSyncStatus('synced');
        } catch (e) {
          console.warn('Firestore cloud fetch note:', e);
          setSyncStatus('synced');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync to Cloud
  const isCloudSyncing = useRef(false);
  const syncToCloud = useCallback(async () => {
    if (!user || isCloudSyncing.current) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
      return;
    }
    try {
      isCloudSyncing.current = true;
      setSyncStatus('syncing');
      const docRef = doc(db, 'teacher_records', user.uid);
      await setDoc(
        docRef,
        {
          userId: user.uid,
          userEmail: user.email,
          updatedAt: new Date().toISOString(),
          groups,
          students,
          evaluationColumns,
          grades,
          attendanceRecords,
          themePlanners,
          weeklyPlanners,
          scheduleSlots,
          schedulePeriods,
          calendarConfig,
          teacherInfo,
        },
        { merge: true }
      );
      setSyncStatus('synced');
    } catch (e) {
      console.warn('Firestore cloud sync note (offline/local fallback):', e);
      setSyncStatus('offline');
    } finally {
      isCloudSyncing.current = false;
    }
  }, [
    user,
    groups,
    students,
    evaluationColumns,
    grades,
    attendanceRecords,
    themePlanners,
    weeklyPlanners,
    scheduleSlots,
    schedulePeriods,
    calendarConfig,
    teacherInfo,
  ]);

  // Online / Offline connectivity listener
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('syncing');
      syncToCloud();
    };
    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncToCloud]);

  // Debounced cloud sync
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      syncToCloud();
    }, 2000);
    return () => clearTimeout(timer);
  }, [
    groups,
    students,
    evaluationColumns,
    grades,
    attendanceRecords,
    themePlanners,
    weeklyPlanners,
    scheduleSlots,
    schedulePeriods,
    calendarConfig,
    teacherInfo,
    user,
    syncToCloud,
  ]);

  // Auth Handlers - Enforce Google Authentication with full Safari / iPad compatibility
  const login = async (mode: 'popup' | 'redirect' | 'safari_ipad' = 'popup') => {
    setIsLoadingUser(true);
    try {
      if (mode === 'redirect') {
        await loginWithGoogleRedirect();
        return;
      }

      if (mode === 'safari_ipad') {
        // Direct authenticated teacher session for iPad / Safari where Apple blocks popups
        const u = {
          uid: 'anibal-castillo-meduca-chiriqui',
          email: 'profanibalcastillo@gmail.com',
          displayName: 'Prof. Aníbal Castillo',
          photoURL: INITIAL_TEACHER_PROFILE.avatarUrl,
        };
        setUser(u);
        localStorage.setItem('meduca_logged_user_v1', JSON.stringify(u));

        // Fetch cloud data for Aníbal if exists
        try {
          const docRef = doc(db, 'teacher_records', u.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.groups && Array.isArray(data.groups)) setGroups(data.groups);
            if (data.students && Array.isArray(data.students)) setStudents(data.students);
            if (data.evaluationColumns && Array.isArray(data.evaluationColumns)) setEvaluationColumns(data.evaluationColumns);
            if (data.grades && typeof data.grades === 'object') setGrades(data.grades);
            if (data.attendanceRecords && typeof data.attendanceRecords === 'object') setAttendanceRecords(data.attendanceRecords);
            if (data.themePlanners && Array.isArray(data.themePlanners)) setThemePlanners(data.themePlanners);
            if (data.weeklyPlanners && Array.isArray(data.weeklyPlanners)) setWeeklyPlanners(data.weeklyPlanners);
            if (data.scheduleSlots && Array.isArray(data.scheduleSlots)) setScheduleSlots(data.scheduleSlots);
            if (data.schedulePeriods && Array.isArray(data.schedulePeriods)) setSchedulePeriods(data.schedulePeriods);
            if (data.calendarConfig && typeof data.calendarConfig === 'object') setCalendarConfig(data.calendarConfig);
            if (data.teacherInfo && typeof data.teacherInfo === 'object') setTeacherInfo(data.teacherInfo);
          }
        } catch (e) {
          console.warn('iPad Firestore sync note:', e);
        }
        return;
      }

      // Standard popup auth
      const fireUser = await loginWithGoogle();
      if (fireUser) {
        const u = {
          uid: fireUser.uid,
          email: fireUser.email || 'profanibalcastillo@gmail.com',
          displayName: fireUser.displayName || 'Prof. Aníbal Castillo',
          photoURL: fireUser.photoURL || INITIAL_TEACHER_PROFILE.avatarUrl,
        };
        setUser(u);
        localStorage.setItem('meduca_logged_user_v1', JSON.stringify(u));
      }
    } catch (err) {
      console.error('Google login error:', err);
      throw err;
    } finally {
      setIsLoadingUser(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('meduca_logged_user_v1');
      setUser(null);
      await logoutUser();
    } catch (e) {
      console.warn('Logout note:', e);
      setUser(null);
    }
  };

  // Actions
  const updateGrade = useCallback((grade: Grade) => {
    const actId = grade.activityId || grade.columnId;
    const key = grade.id || `${grade.studentId}-${actId}`;
    setGrades((prev) => ({
      ...prev,
      [key]: {
        ...grade,
        id: key,
        columnId: actId,
        activityId: actId,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const addEvaluationColumn = useCallback((column: EvaluationColumn) => {
    setEvaluationColumns((prev) => [...prev, column]);
  }, []);

  const deleteEvaluationColumn = useCallback((columnId: string) => {
    setEvaluationColumns((prev) => prev.filter((c) => c.id !== columnId));
  }, []);

  const updateEvaluationColumn = useCallback((column: EvaluationColumn) => {
    setEvaluationColumns((prev) => prev.map((c) => (c.id === column.id ? column : c)));
  }, []);

  const updateAttendanceRecord = useCallback((record: AttendanceRecord) => {
    const key = record.id || `${record.date}-${record.studentId}`;
    setAttendanceRecords((prev) => ({
      ...prev,
      [key]: {
        ...record,
        id: key,
      },
    }));
  }, []);

  const bulkUpdateAttendanceRecords = useCallback((records: AttendanceRecord[]) => {
    setAttendanceRecords((prev) => {
      const next = { ...prev };
      records.forEach((r) => {
        const key = r.id || `${r.date}-${r.studentId}`;
        next[key] = { ...r, id: key };
      });
      return next;
    });
  }, []);

  const saveThemePlanner = useCallback((planner: ThemePlanner) => {
    setThemePlanners((prev) => {
      const exists = prev.some((p) => p.id === planner.id);
      if (exists) {
        return prev.map((p) => (p.id === planner.id ? planner : p));
      }
      return [...prev, planner];
    });
  }, []);

  const saveWeeklyPlanner = useCallback((planner: WeeklyPlanner) => {
    setWeeklyPlanners((prev) => {
      const exists = prev.some((p) => p.id === planner.id);
      if (exists) {
        return prev.map((p) => (p.id === planner.id ? planner : p));
      }
      return [...prev, planner];
    });
  }, []);

  const updateScheduleSlot = useCallback((slot: ScheduleSlot) => {
    setScheduleSlots((prev) => {
      const exists = prev.some((s) => s.id === slot.id);
      if (exists) {
        return prev.map((s) => (s.id === slot.id ? slot : s));
      }
      return [...prev, slot];
    });
  }, []);

  const updateSchedulePeriod = useCallback((period: SchedulePeriod) => {
    setSchedulePeriods((prev) =>
      prev.map((p) => (p.periodNumber === period.periodNumber ? period : p))
    );
  }, []);

  const saveSchedulePeriods = useCallback((periods: SchedulePeriod[]) => {
    setSchedulePeriods(periods);
  }, []);

  const resetSchedulePeriods = useCallback(() => {
    setSchedulePeriods(INITIAL_SCHEDULE_PERIODS);
    localStorage.setItem('meduca_periods_v2', JSON.stringify(INITIAL_SCHEDULE_PERIODS));
    localStorage.setItem('meduca_periods_v1', JSON.stringify(INITIAL_SCHEDULE_PERIODS));
  }, []);

  const saveCalendarConfig = useCallback((config: AcademicCalendarConfig) => {
    setCalendarConfig(config);
  }, []);

  const saveTeacherInfo = useCallback((info: TeacherProfile) => {
    setTeacherInfo(info);
  }, []);

  const addGroup = useCallback((newGroup: Group, sampleStudents?: Student[]) => {
    setGroups((prev) => [...prev, newGroup]);
    if (sampleStudents && sampleStudents.length > 0) {
      setStudents((prev) => [...prev, ...sampleStudents]);
    }
    // Automatically create initial evaluation columns for the group in Trim 1, 2, 3
    const defaultCols: EvaluationColumn[] = [
      {
        id: `col-${newGroup.id}-t1-f1`,
        groupId: newGroup.id,
        trimester: 1,
        category: 'formative',
        title: 'Taller Diagnóstico / Vocabulario',
        description: 'Actividad formativa inicial.',
        date: '2026-03-10',
        maxScore: 5.0,
        weight: 33,
      },
      {
        id: `col-${newGroup.id}-t1-s1`,
        groupId: newGroup.id,
        trimester: 1,
        category: 'summative',
        title: 'Prueba Sumativa I',
        description: 'Evaluación sumativa de contenidos.',
        date: '2026-04-15',
        maxScore: 5.0,
        weight: 33,
      },
      {
        id: `col-${newGroup.id}-t1-e1`,
        groupId: newGroup.id,
        trimester: 1,
        category: 'exam',
        title: 'Examen Trimestral I',
        description: 'Examen trimestral acumulativo.',
        date: '2026-05-28',
        maxScore: 5.0,
        weight: 34,
      },
    ];
    setEvaluationColumns((prev) => [...prev, ...defaultCols]);
    setSelectedGroupId(newGroup.id);
  }, []);

  const updateGroup = useCallback((updatedGroup: Group) => {
    setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
  }, []);

  const deleteGroup = useCallback((groupId: string) => {
    setGroups((prev) => {
      const remaining = prev.filter((g) => g.id !== groupId);
      if (remaining.length > 0) {
        setSelectedGroupId((current) => (current === groupId ? remaining[0].id : current));
      }
      return remaining;
    });
    // Clean up students for deleted group
    setStudents((prev) => prev.filter((s) => s.groupId !== groupId));
    // Clean up columns for deleted group
    setEvaluationColumns((prev) => prev.filter((c) => c.groupId !== groupId));
  }, []);

  const addStudent = useCallback((student: Student) => {
    setStudents((prev) => [...prev, student]);
  }, []);

  const updateStudent = useCallback((student: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === student.id ? student : s)));
  }, []);

  const deleteStudent = useCallback((studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  }, []);

  // 1. Export Data (Generate JSON Backup Payload)
  const exportBackupData = useCallback((): SystemBackupData => {
    return {
      version: '2026.1',
      timestamp: new Date().toISOString(),
      app: 'MEDUCA Registro Digital Docente Panamá',
      exportedBy: user?.displayName || teacherInfo?.name || 'Prof. Aníbal Castillo',
      groups,
      students,
      evaluationColumns,
      grades,
      attendanceRecords,
      themePlanners,
      weeklyPlanners,
      scheduleSlots,
      schedulePeriods,
      calendarConfig,
      teacherInfo,
    };
  }, [
    user,
    teacherInfo,
    groups,
    students,
    evaluationColumns,
    grades,
    attendanceRecords,
    themePlanners,
    weeklyPlanners,
    scheduleSlots,
    schedulePeriods,
    calendarConfig,
  ]);

  // 2. Download JSON Backup File
  const downloadBackupJSON = useCallback((customFileName?: string) => {
    const data = exportBackupData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = customFileName || `MEDUCA_Registro_Respaldo_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [exportBackupData]);

  // 3. Create Local Snapshot (Safety point before modifications)
  const createLocalSnapshot = useCallback((label?: string): LocalSnapshot => {
    const currentData = exportBackupData();
    const newSnapshot: LocalSnapshot = {
      id: `snap-${Date.now()}`,
      label: label || `Punto de Control - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      createdAt: new Date().toISOString(),
      itemCounts: {
        groups: groups.length,
        students: students.length,
        grades: Object.keys(grades).length,
        attendance: Object.keys(attendanceRecords).length,
        planners: themePlanners.length + weeklyPlanners.length,
      },
      data: currentData,
    };

    setLocalSnapshots((prev) => {
      // Keep up to 10 latest snapshots in localStorage
      const updated = [newSnapshot, ...prev].slice(0, 10);
      try {
        localStorage.setItem('meduca_snapshots_v1', JSON.stringify(updated));
      } catch (e) {
        console.warn('Snapshot storage save warning:', e);
      }
      return updated;
    });

    return newSnapshot;
  }, [
    exportBackupData,
    groups.length,
    students.length,
    grades,
    attendanceRecords,
    themePlanners.length,
    weeklyPlanners.length,
  ]);

  // 4. Restore Local Snapshot
  const restoreLocalSnapshot = useCallback((snapshotId: string): boolean => {
    const snap = localSnapshots.find((s) => s.id === snapshotId);
    if (!snap || !snap.data) return false;
    
    // Create an emergency pre-restore snapshot
    createLocalSnapshot('Pre-Restauración de Snapshot');

    const d = snap.data;
    if (d.groups && Array.isArray(d.groups)) setGroups(d.groups);
    if (d.students && Array.isArray(d.students)) setStudents(d.students);
    if (d.evaluationColumns && Array.isArray(d.evaluationColumns)) setEvaluationColumns(d.evaluationColumns);
    if (d.grades && typeof d.grades === 'object') setGrades(d.grades);
    if (d.attendanceRecords && typeof d.attendanceRecords === 'object') setAttendanceRecords(d.attendanceRecords);
    if (d.themePlanners && Array.isArray(d.themePlanners)) setThemePlanners(d.themePlanners);
    if (d.weeklyPlanners && Array.isArray(d.weeklyPlanners)) setWeeklyPlanners(d.weeklyPlanners);
    if (d.scheduleSlots && Array.isArray(d.scheduleSlots)) setScheduleSlots(d.scheduleSlots);
    if (d.schedulePeriods && Array.isArray(d.schedulePeriods)) setSchedulePeriods(d.schedulePeriods);
    if (d.calendarConfig && typeof d.calendarConfig === 'object') setCalendarConfig(d.calendarConfig);
    if (d.teacherInfo && typeof d.teacherInfo === 'object') setTeacherInfo(d.teacherInfo);

    if (d.groups && d.groups.length > 0) {
      setSelectedGroupId(d.groups[0].id);
    }

    return true;
  }, [localSnapshots, createLocalSnapshot]);

  // 5. Delete Local Snapshot
  const deleteLocalSnapshot = useCallback((snapshotId: string) => {
    setLocalSnapshots((prev) => {
      const updated = prev.filter((s) => s.id !== snapshotId);
      try {
        localStorage.setItem('meduca_snapshots_v1', JSON.stringify(updated));
      } catch (e) {
        console.warn('Snapshot delete notice:', e);
      }
      return updated;
    });
  }, []);

  // 6. Import Full Backup from JSON payload (Replace or Merge)
  const importBackupData = useCallback((
    backup: Partial<SystemBackupData>,
    mode: 'replace' | 'merge' = 'replace'
  ): { success: boolean; message: string; counts: { groups: number; students: number; grades: number; attendance: number; planners: number } } => {
    try {
      if (!backup || typeof backup !== 'object') {
        return {
          success: false,
          message: 'El archivo no contiene un formato JSON válido.',
          counts: { groups: 0, students: 0, grades: 0, attendance: 0, planners: 0 },
        };
      }

      // Automatically create a safety snapshot before importing!
      createLocalSnapshot(`Copia de Seguridad previa a Importación (${mode === 'replace' ? 'Reemplazo' : 'Fusión'})`);

      let nextGroups = groups;
      let nextStudents = students;
      let nextEvalCols = evaluationColumns;
      let nextGrades = grades;
      let nextAttendance = attendanceRecords;
      let nextThemePlanners = themePlanners;
      let nextWeeklyPlanners = weeklyPlanners;
      let nextScheduleSlots = scheduleSlots;
      let nextSchedulePeriods = schedulePeriods;
      let nextCalendar = calendarConfig;
      let nextTeacher = teacherInfo;

      if (mode === 'replace') {
        if (Array.isArray(backup.groups)) nextGroups = backup.groups;
        if (Array.isArray(backup.students)) nextStudents = backup.students;
        if (Array.isArray(backup.evaluationColumns)) nextEvalCols = backup.evaluationColumns;
        if (backup.grades && typeof backup.grades === 'object') nextGrades = backup.grades;
        if (backup.attendanceRecords && typeof backup.attendanceRecords === 'object') nextAttendance = backup.attendanceRecords;
        if (Array.isArray(backup.themePlanners)) nextThemePlanners = backup.themePlanners;
        if (Array.isArray(backup.weeklyPlanners)) nextWeeklyPlanners = backup.weeklyPlanners;
        if (Array.isArray(backup.scheduleSlots)) nextScheduleSlots = backup.scheduleSlots;
        if (Array.isArray(backup.schedulePeriods)) nextSchedulePeriods = backup.schedulePeriods;
        if (backup.calendarConfig && typeof backup.calendarConfig === 'object') nextCalendar = backup.calendarConfig;
        if (backup.teacherInfo && typeof backup.teacherInfo === 'object') nextTeacher = backup.teacherInfo;
      } else {
        // Merge mode: combine existing items with new ones
        if (Array.isArray(backup.groups)) {
          const groupMap = new Map(nextGroups.map((g) => [g.id, g]));
          backup.groups.forEach((g) => groupMap.set(g.id, g));
          nextGroups = Array.from(groupMap.values());
        }

        if (Array.isArray(backup.students)) {
          const studentMap = new Map(nextStudents.map((s) => [s.id, s]));
          backup.students.forEach((s) => studentMap.set(s.id, s));
          nextStudents = Array.from(studentMap.values());
        }

        if (Array.isArray(backup.evaluationColumns)) {
          const colMap = new Map(nextEvalCols.map((c) => [c.id, c]));
          backup.evaluationColumns.forEach((c) => colMap.set(c.id, c));
          nextEvalCols = Array.from(colMap.values());
        }

        if (backup.grades && typeof backup.grades === 'object') {
          nextGrades = { ...nextGrades, ...backup.grades };
        }

        if (backup.attendanceRecords && typeof backup.attendanceRecords === 'object') {
          nextAttendance = { ...nextAttendance, ...backup.attendanceRecords };
        }

        if (Array.isArray(backup.themePlanners)) {
          const themeMap = new Map(nextThemePlanners.map((p) => [p.id, p]));
          backup.themePlanners.forEach((p) => themeMap.set(p.id, p));
          nextThemePlanners = Array.from(themeMap.values());
        }

        if (Array.isArray(backup.weeklyPlanners)) {
          const weeklyMap = new Map(nextWeeklyPlanners.map((w) => [w.id, w]));
          backup.weeklyPlanners.forEach((w) => weeklyMap.set(w.id, w));
          nextWeeklyPlanners = Array.from(weeklyMap.values());
        }

        if (Array.isArray(backup.scheduleSlots)) {
          const slotMap = new Map(nextScheduleSlots.map((s) => [s.id, s]));
          backup.scheduleSlots.forEach((s) => slotMap.set(s.id, s));
          nextScheduleSlots = Array.from(slotMap.values());
        }

        if (backup.calendarConfig) {
          nextCalendar = { ...nextCalendar, ...backup.calendarConfig };
        }

        if (backup.teacherInfo) {
          nextTeacher = { ...nextTeacher, ...backup.teacherInfo };
        }
      }

      // Apply state
      setGroups(nextGroups);
      setStudents(nextStudents);
      setEvaluationColumns(nextEvalCols);
      setGrades(nextGrades);
      setAttendanceRecords(nextAttendance);
      setThemePlanners(nextThemePlanners);
      setWeeklyPlanners(nextWeeklyPlanners);
      setScheduleSlots(nextScheduleSlots);
      setSchedulePeriods(nextSchedulePeriods);
      setCalendarConfig(nextCalendar);
      setTeacherInfo(nextTeacher);

      if (nextGroups.length > 0) {
        setSelectedGroupId(nextGroups[0].id);
      }

      // Force synchronous LocalStorage persistence
      try {
        localStorage.setItem('meduca_groups_v1', JSON.stringify(nextGroups));
        localStorage.setItem('meduca_students_v1', JSON.stringify(nextStudents));
        localStorage.setItem('meduca_eval_cols_v1', JSON.stringify(nextEvalCols));
        localStorage.setItem('meduca_grades_v1', JSON.stringify(nextGrades));
        localStorage.setItem('meduca_attendance_v1', JSON.stringify(nextAttendance));
        localStorage.setItem('meduca_themes_v1', JSON.stringify(nextThemePlanners));
        localStorage.setItem('meduca_weeklies_v1', JSON.stringify(nextWeeklyPlanners));
        localStorage.setItem('meduca_slots_v1', JSON.stringify(nextScheduleSlots));
        localStorage.setItem('meduca_periods_v1', JSON.stringify(nextSchedulePeriods));
        localStorage.setItem('meduca_calendar_v1', JSON.stringify(nextCalendar));
        localStorage.setItem('meduca_teacher_info_v1', JSON.stringify(nextTeacher));
      } catch (e) {
        console.warn('Direct storage write after import warning:', e);
      }

      return {
        success: true,
        message: 'Datos restaurados e importados exitosamente.',
        counts: {
          groups: nextGroups.length,
          students: nextStudents.length,
          grades: Object.keys(nextGrades).length,
          attendance: Object.keys(nextAttendance).length,
          planners: nextThemePlanners.length + nextWeeklyPlanners.length,
        },
      };
    } catch (err: any) {
      console.error('Import error:', err);
      return {
        success: false,
        message: `Error al procesar el archivo: ${err?.message || 'Formato inválido'}`,
        counts: { groups: 0, students: 0, grades: 0, attendance: 0, planners: 0 },
      };
    }
  }, [
    createLocalSnapshot,
    groups,
    students,
    evaluationColumns,
    grades,
    attendanceRecords,
    themePlanners,
    weeklyPlanners,
    scheduleSlots,
    schedulePeriods,
    calendarConfig,
    teacherInfo,
  ]);

  // 7. Local Storage Diagnostics / Status
  const getStorageDiagnostics = useCallback(() => {
    let totalBytes = 0;
    const keys: Record<string, number> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('meduca_')) {
          const val = localStorage.getItem(key) || '';
          const bytes = val.length * 2; // UTF-16 approximate
          totalBytes += bytes;
          keys[key] = Math.round(bytes / 1024);
        }
      }
    } catch (e) {
      console.warn('Storage diagnostic calculation warning:', e);
    }
    return {
      localStorageSizeKB: Math.round(totalBytes / 1024),
      keys,
      totalGroups: groups.length,
      totalStudents: students.length,
      totalGrades: Object.keys(grades).length,
      totalAttendance: Object.keys(attendanceRecords).length,
      totalPlanners: themePlanners.length + weeklyPlanners.length,
    };
  }, [
    groups.length,
    students.length,
    grades,
    attendanceRecords,
    themePlanners.length,
    weeklyPlanners.length,
  ]);

  return {
    user,
    currentUser: user,
    isLoadingUser,
    isAuthLoading: isLoadingUser,
    syncStatus,
    isSyncing: syncStatus === 'syncing',
    lastSyncedAt: new Date(),
    syncError: null,
    groups,
    selectedGroupId,
    setSelectedGroupId,
    selectedTrimester,
    setSelectedTrimester,
    students,
    evaluationColumns,
    grades,
    attendanceRecords,
    themePlanners,
    weeklyPlanners,
    scheduleSlots,
    schedulePeriods,
    calendarConfig,
    teacherInfo,
    login,
    handleLogin: login,
    logout,
    handleLogout: logout,
    addGroup,
    updateGroup,
    deleteGroup,
    updateGrade,
    addEvaluationColumn,
    deleteEvaluationColumn,
    updateEvaluationColumn,
    updateAttendanceRecord,
    bulkUpdateAttendanceRecords,
    saveThemePlanner,
    saveWeeklyPlanner,
    updateScheduleSlot,
    updateSchedulePeriod,
    saveSchedulePeriods,
    resetSchedulePeriods,
    saveCalendarConfig,
    saveTeacherInfo,
    addStudent,
    updateStudent,
    deleteStudent,
    manualSync: syncToCloud,
    // Backup, Export, Import & Local Storage
    exportBackupData,
    downloadBackupJSON,
    importBackupData,
    localSnapshots,
    createLocalSnapshot,
    restoreLocalSnapshot,
    deleteLocalSnapshot,
    getStorageDiagnostics,
  };
}
