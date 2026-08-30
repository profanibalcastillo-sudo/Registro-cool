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
  ExternalLink,
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => Promise<void>;
  isLoading?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLoading = false }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Authenticate exclusively with Google Account
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      await onLogin();
    } catch (error: any) {
      console.error('Error during Google login:', error);
      if (error?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('La ventana de inicio de sesión con Google fue cerrada antes de autorizar el acceso.');
      } else if (error?.code === 'auth/popup-blocked') {
        setErrorMessage(
          'El navegador bloqueó la ventana emergente de Google. Por favor, permite ventanas emergentes (popups) para este sitio y vuelve a intentarlo.'
        );
      } else if (error?.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Se canceló la solicitud de autenticación con Google.');
      } else {
        setErrorMessage(
          error?.message || 'No se pudo completar la autenticación con Google. Por favor, intenta de nuevo.'
        );
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Bar Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4">
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
            <span className="hidden sm:inline">Autenticación Google Obligatoria</span>
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
                Inicia sesión de forma segura con tu cuenta de Google (<b className="text-blue-300">profanibalcastillo@gmail.com</b>) para acceder a tu libreta de calificaciones MEDUCA, control de asistencia, horario escolar en tiempo real con timbre acústico y planificador didáctico por competencias.
              </p>
            </div>

            {/* Feature Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <Award className="w-4 h-4" />
                  <span>Libreta & Ponderaciones</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Cálculo automático de notas (1.0 a 5.0), apreciación y exámenes por trimestre.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Clock className="w-4 h-4" />
                  <span>Horario & Timbre en Vivo</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  9 períodos de clase, cuenta regresiva, alarmas acústicas y pre-aviso de 5 min.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>3 Trimestres & Calendario</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Personalización de fechas de inicio, cierre y recesos del año lectivo.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
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

          {/* Right Column: Secure Google Login Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30 text-white border border-blue-400/30">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white">Acceso al Sistema</h3>
                <p className="text-xs text-slate-400">
                  Autenticación obligatoria con Google para acceder o cambiar de usuario.
                </p>
              </div>

              {/* Target Account Badge */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-blue-500/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white border border-blue-400 shrink-0">
                  AC
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-bold text-white truncate">Prof. Aníbal Castillo</div>
                  <div className="text-[11px] text-blue-300 font-mono truncate">profanibalcastillo@gmail.com</div>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 shrink-0">
                  Autorizado
                </div>
              </div>

              {/* Error Box if any */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-700 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{errorMessage}</p>
                    <p className="text-[11px] text-rose-300">
                      Por favor, haz clic en el botón de abajo para reintentar la conexión con tu cuenta de Google.
                    </p>
                  </div>
                </div>
              )}

              {/* Google Login Action */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  id="google-login-button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn || isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-bold text-xs shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 border border-slate-300 disabled:opacity-60 cursor-pointer group"
                >
                  {isLoggingIn || isLoading ? (
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span className="font-bold">Conectando con Google...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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
                      <span className="text-sm font-black">Iniciar Sesión con Google</span>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform ml-auto" />
                    </>
                  )}
                </button>
              </div>

              {/* Security & Sync Details */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2 text-slate-300">
                  <Cloud className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Sincronización en tiempo real con Firebase Firestore</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>No se permite cambiar de usuario sin autenticar con Google</span>
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
