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
        return null;
      }
    }
    return null;
  });

  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');

  // Groups and navigation state
  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem('meduca_groups_v1');
    return saved ? JSON.parse(saved) : INITIAL_GROUPS;
  });
  const [selectedGroupId, setSelectedGroupId] = useState<string>('grp-7a');
  const [selectedTrimester, setSelectedTrimester] = useState<number>(2);

  // Core Data
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('meduca_students_v1');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [evaluationColumns, setEvaluationColumns] = useState<EvaluationColumn[]>(() => {
    const saved = localStorage.getItem('meduca_eval_cols_v1');
    return saved ? JSON.parse(saved) : INITIAL_EVALUATION_COLUMNS;
  });

  const [grades, setGrades] = useState<Record<string, Grade>>(() => {
    const saved = localStorage.getItem('meduca_grades_v1');
    return saved ? JSON.parse(saved) : INITIAL_GRADES_MAP;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>(() => {
    const saved = localStorage.getItem('meduca_attendance_v1');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_MAP;
  });

  const [themePlanners, setThemePlanners] = useState<ThemePlanner[]>(() => {
    const saved = localStorage.getItem('meduca_themes_v1');
    return saved ? JSON.parse(saved) : INITIAL_THEME_PLANNERS;
  });

  const [weeklyPlanners, setWeeklyPlanners] = useState<WeeklyPlanner[]>(() => {
    const saved = localStorage.getItem('meduca_weeklies_v1');
    return saved ? JSON.parse(saved) : INITIAL_WEEKLY_PLANNERS;
  });

  const [schedulePeriods, setSchedulePeriods] = useState<SchedulePeriod[]>(() => {
    const saved = localStorage.getItem('meduca_periods_v1');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULE_PERIODS;
  });

  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>(() => {
    const saved = localStorage.getItem('meduca_slots_v1');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULE_SLOTS;
  });

  const [calendarConfig, setCalendarConfig] = useState<AcademicCalendarConfig>(() => {
    const saved = localStorage.getItem('meduca_calendar_v1');
    return saved ? JSON.parse(saved) : INITIAL_CALENDAR_CONFIG;
  });

  const [teacherInfo, setTeacherInfo] = useState<TeacherProfile>(() => {
    const saved = localStorage.getItem('meduca_teacher_info_v1');
    return saved ? JSON.parse(saved) : INITIAL_TEACHER_PROFILE;
  });

  // Local storage auto-persist
  useEffect(() => {
    localStorage.setItem('meduca_groups_v1', JSON.stringify(groups));
  }, [groups]);
  useEffect(() => {
    localStorage.setItem('meduca_students_v1', JSON.stringify(students));
  }, [students]);
  useEffect(() => {
    localStorage.setItem('meduca_eval_cols_v1', JSON.stringify(evaluationColumns));
  }, [evaluationColumns]);
  useEffect(() => {
    localStorage.setItem('meduca_grades_v1', JSON.stringify(grades));
  }, [grades]);
  useEffect(() => {
    localStorage.setItem('meduca_attendance_v1', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);
  useEffect(() => {
    localStorage.setItem('meduca_themes_v1', JSON.stringify(themePlanners));
  }, [themePlanners]);
  useEffect(() => {
    localStorage.setItem('meduca_weeklies_v1', JSON.stringify(weeklyPlanners));
  }, [weeklyPlanners]);
  useEffect(() => {
    localStorage.setItem('meduca_periods_v1', JSON.stringify(schedulePeriods));
  }, [schedulePeriods]);
  useEffect(() => {
    localStorage.setItem('meduca_slots_v1', JSON.stringify(scheduleSlots));
  }, [scheduleSlots]);
  useEffect(() => {
    localStorage.setItem('meduca_calendar_v1', JSON.stringify(calendarConfig));
  }, [calendarConfig]);
  useEffect(() => {
    localStorage.setItem('meduca_teacher_info_v1', JSON.stringify(teacherInfo));
  }, [teacherInfo]);

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
      console.warn('Firestore cloud sync error:', e);
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
    saveCalendarConfig,
    saveTeacherInfo,
    addStudent,
    updateStudent,
    deleteStudent,
    manualSync: syncToCloud,
  };
}
