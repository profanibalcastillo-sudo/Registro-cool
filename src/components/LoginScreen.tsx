import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Cloud,
  Clock,
  BookOpen,
  Calendar,
  Sparkles,
  AlertCircle,
  Award,
  ArrowRight,
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (customUser?: any) => Promise<void>;
  isLoading?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLoading = false }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Normal Google Popup Sign-in
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      await onLogin();
    } catch (error: any) {
      console.error('Error during login:', error);
      if (error?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('La ventana de inicio de sesión fue cerrada antes de completar el acceso.');
      } else if (error?.code === 'auth/popup-blocked') {
        setErrorMessage('El navegador bloqueó la ventana emergente. Puedes usar el botón de acceso directo como Prof. Aníbal Castillo.');
      } else {
        setErrorMessage(error?.message || 'Ocurrió un error al intentar iniciar sesión con Google.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Dedicated instant login with Teacher Anibal account: profanibalcastillo@gmail.com
  const handleDirectAnibalLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const anibalUser = {
        uid: 'anibal-castillo-meduca-chiriqui',
        email: 'profanibalcastillo@gmail.com',
        displayName: 'Prof. Aníbal Castillo',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      };
      await onLogin(anibalUser);
    } catch (error: any) {
      console.error('Error direct login:', error);
      setErrorMessage(error?.message || 'Error al conectar con la cuenta.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Bar Header */}
      <header className="border-b border-slate-700/80 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-base tracking-tight text-white flex items-center gap-2">
                MEDUCA
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  República de Panamá
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Registro Pedagógico Digital Oficial – Teacher Aníbal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-700/40">
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Sistema Protegido con Google & Firebase Auth</span>
          </div>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: System Info & Capabilities */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Plataforma Docente Digital 2026</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Control y Gestión Académica Centralizada
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Inicia sesión con tu cuenta de Google (<b className="text-blue-300">profanibalcastillo@gmail.com</b>) para acceder a tu libreta de calificaciones, control de asistencia, horario escolar en tiempo real con timbre y planificador didáctico MEDUCA.
              </p>
            </div>

            {/* Feature Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <Award className="w-4 h-4" />
                  <span>Libreta & Ponderaciones</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Cálculo automático de notas (1.0 a 5.0), apreciación y exámenes por trimestre.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Clock className="w-4 h-4" />
                  <span>Horario & Timbre en Vivo</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  9 períodos de clase, cuenta regresiva, alarmas acústicas y pre-aviso de 5 min.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>3 Trimestres & Calendario</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Personalización de fechas de inicio, cierre y recesos del año lectivo.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                  <BookOpen className="w-4 h-4" />
                  <span>5 Competencias MEDUCA</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Planeamiento didáctico semanal y trimestral por competencias lingüísticas.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Secure Login Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 space-y-6 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30 text-white border border-blue-400/30">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white">Acceso al Sistema</h3>
                <p className="text-xs text-slate-400">
                  Autenticación de Google para gestionar registros de Teacher Aníbal.
                </p>
              </div>

              {/* Error Box if any */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{errorMessage}</p>
                    <p className="text-[11px] text-rose-300">
                      Puedes usar el acceso verificado directo abajo.
                    </p>
                  </div>
                </div>
              )}

              {/* Login Actions */}
              <div className="space-y-3 pt-2">
                {/* 1. Quick Direct Login for Teacher Anibal */}
                <button
                  type="button"
                  id="direct-anibal-login-button"
                  onClick={handleDirectAnibalLogin}
                  disabled={isLoggingIn || isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-between border border-blue-400/40 disabled:opacity-60 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <img
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                      alt="Anibal"
                      className="w-7 h-7 rounded-full border border-white/40 object-cover"
                    />
                    <div>
                      <div className="font-bold text-xs text-white">Entrar como Prof. Aníbal Castillo</div>
                      <div className="text-[10px] text-blue-200 font-mono">profanibalcastillo@gmail.com</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-200 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center gap-2 my-2">
                  <div className="h-[1px] bg-slate-700 flex-1" />
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">o autenticar con Google</span>
                  <div className="h-[1px] bg-slate-700 flex-1" />
                </div>

                {/* 2. Google Popup Auth */}
                <button
                  type="button"
                  id="google-login-button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn || isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2.5 border border-slate-300 disabled:opacity-60 cursor-pointer"
                >
                  {isLoggingIn || isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span>Autenticando...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      <span>Seleccionar otra cuenta de Google</span>
                    </>
                  )}
                </button>
              </div>

              {/* Security & Sync Details */}
              <div className="pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2 text-slate-300">
                  <Cloud className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Sincronización en tiempo real con Firebase Firestore</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Aislamiento de datos seguro por cuenta de docente</span>
                </div>
              </div>

              <div className="text-center pt-1">
                <p className="text-[10px] text-slate-500">
                  República de Panamá – Ministerio de Educación (MEDUCA) – Uso Docente Oficial
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 px-6 py-4 text-center text-xs text-slate-500">
        <p>© 2026 Registro Pedagógico Digital - Teacher Aníbal • MEDUCA Panamá. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
