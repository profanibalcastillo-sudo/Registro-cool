import React, { useState, useEffect } from 'react';
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
  Tablet,
  Smartphone,
  Compass,
  RefreshCw,
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (mode?: 'popup' | 'redirect' | 'safari_ipad') => Promise<void>;
  isLoading?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLoading = false }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAppleOrIpad, setIsAppleOrIpad] = useState(false);

  useEffect(() => {
    // Detect iOS / iPadOS / Safari environment
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isMacTouch = /Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1;
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    if (isIos || isMacTouch || isSafari) {
      setIsAppleOrIpad(true);
    }
  }, []);

  // 1. Authenticate via Google Popup
  const handleGooglePopupLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      await onLogin('popup');
    } catch (error: any) {
      console.error('Error during Google popup login:', error);
      if (error?.code === 'auth/popup-blocked' || error?.message?.includes('popup')) {
        setErrorMessage(
          'Safari en tu iPad ha bloqueado la ventana emergente (Pop-up). Puedes pulsar el botón "Acceso Directo iPad / Safari (Sin Pop-up)" o "Iniciar con Redirección" para entrar de inmediato.'
        );
      } else if (error?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('La ventana de Google fue cerrada antes de autorizar el acceso.');
      } else if (error?.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Se canceló la solicitud de autenticación.');
      } else {
        setErrorMessage(
          error?.message || 'No se pudo abrir la ventana de Google. Usa el botón de Acceso iPad / Safari abajo.'
        );
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 2. Authenticate via Full Screen Redirect (For Safari / Mobile)
  const handleGoogleRedirectLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      await onLogin('redirect');
    } catch (error: any) {
      console.error('Error during Google redirect login:', error);
      setErrorMessage('Error al redirigir con Google. Usa el Acceso Directo iPad / Safari.');
      setIsLoggingIn(false);
    }
  };

  // 3. Direct iPad / Safari Mode (Zero Popups - Perfect for Old iPads)
  const handleIpadDirectLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      await onLogin('safari_ipad');
    } catch (error: any) {
      console.error('Error during iPad direct login:', error);
      setErrorMessage('Error al inicializar sesión en iPad.');
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
            <span className="hidden sm:inline">Compatible con iPad, Safari & Dispositivos Móviles</span>
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
                Accede a tu libreta de calificaciones MEDUCA, control de asistencia, horario escolar en tiempo real con timbre acústico y planificador didáctico por competencias para la cuenta autorizada <b className="text-blue-300">profanibalcastillo@gmail.com</b>.
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

          {/* Right Column: Multi-mode Login Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-5 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30 text-white border border-blue-400/30">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Acceso al Sistema</h3>
                <p className="text-xs text-slate-400">
                  Selecciona la opción de acceso adecuada para tu dispositivo.
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
                  Docente
                </div>
              </div>

              {/* Safari / iPad notice */}
              {isAppleOrIpad && (
                <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-700/50 text-[11px] text-indigo-200 flex items-start gap-2">
                  <Tablet className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p>
                    <b>iPad / Safari Detectado:</b> Safari bloquea ventanas emergentes (Pop-ups). Utiliza el botón de <b>Acceso Directo iPad / Safari</b> para entrar sin bloqueos.
                  </p>
                </div>
              )}

              {/* Error Box if any */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-700 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Login Actions for iPad / Safari & Desktop */}
              <div className="space-y-2.5 pt-1">
                
                {/* 1. Direct iPad / Safari Mode Button (100% Pop-up Proof) */}
                <button
                  type="button"
                  id="ipad-safari-direct-login-button"
                  onClick={handleIpadDirectLogin}
                  disabled={isLoggingIn || isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-xs shadow-xl shadow-blue-600/30 transition-all flex items-center justify-between border border-blue-400/40 disabled:opacity-60 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                      <Tablet className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                        <span>Acceso Directo iPad / Safari</span>
                        <span className="text-[9px] bg-emerald-400 text-slate-950 font-black px-1.5 py-0.2 rounded">
                          SIN POP-UP
                        </span>
                      </div>
                      <div className="text-[10px] text-blue-200">
                        Entrar como Prof. Aníbal Castillo (Recomendado iPad)
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-200 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* 2. Standard Google Popup Login */}
                <button
                  type="button"
                  id="google-login-button"
                  onClick={handleGooglePopupLogin}
                  disabled={isLoggingIn || isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2.5 border border-slate-300 disabled:opacity-60 cursor-pointer"
                >
                  {isLoggingIn || isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span>Conectando...</span>
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
                      <span>Iniciar Sesión con Google (Ventana Emergente)</span>
                    </>
                  )}
                </button>

                {/* 3. Redirection Full-Screen Google Auth Option */}
                <button
                  type="button"
                  id="google-redirect-button"
                  onClick={handleGoogleRedirectLogin}
                  disabled={isLoggingIn || isLoading}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold transition-all flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-60 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-blue-400" />
                  <span>Iniciar con Redirección Google (Sin Ventana)</span>
                </button>
              </div>

              {/* Security & Sync Details */}
              <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center gap-2 text-slate-300">
                  <Cloud className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Almacenamiento local ultrarrápido, offline y 100% privado</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Sesión segura encriptada para el docente</span>
                </div>
              </div>

              <div className="text-center pt-0.5">
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
