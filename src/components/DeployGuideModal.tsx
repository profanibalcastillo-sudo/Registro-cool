import React, { useState, useEffect } from 'react';
import {
  Github,
  Globe,
  Flame,
  Key,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Layers,
  Sparkles,
  Server,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import bundledConfig from '../../firebase-applet-config.json';
import { auth, db } from '../services/firebase';

interface DeployGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployGuideModal: React.FC<DeployGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'solution' | 'variables' | 'domains' | 'diagnostic'>('solution');

  // Diagnostic state
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ ok: boolean; message: string; details?: any } | null>(null);

  if (!isOpen) return null;

  const safeConfig: any = bundledConfig || {};
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const envSample = `# =======================================================
# 1. VARIABLE PARA LA INTELIGENCIA ARTIFICIAL GEMINI (BACKEND)
# Obtenla gratis en: https://aistudio.google.com/app/apikey
# =======================================================
GEMINI_API_KEY="AIzaSy..."

# =======================================================
# 2. VARIABLES DE FIREBASE Y FIRESTORE (CLIENTE VITE)
# Estas variables permiten sincronizar grupos, notas y asistencia en la nube
# =======================================================
VITE_FIREBASE_PROJECT_ID="${safeConfig.projectId || 'project-61dda391-970c-4803-983'}"
VITE_FIREBASE_APP_ID="${safeConfig.appId || '1:275152670174:web:2c243c6f02e456b226214f'}"
VITE_FIREBASE_API_KEY="${safeConfig.apiKey || 'AIzaSyB_4fL1Qp5QSPVW7aATrM2-zMAxdauYCig'}"
VITE_FIREBASE_AUTH_DOMAIN="${safeConfig.authDomain || 'project-61dda391-970c-4803-983.firebaseapp.com'}"
VITE_FIREBASE_STORAGE_BUCKET="${safeConfig.storageBucket || 'project-61dda391-970c-4803-983.firebasestorage.app'}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${safeConfig.messagingSenderId || '275152670174'}"
VITE_FIREBASE_OAUTH_CLIENT_ID="${safeConfig.oAuthClientId || '275152670174-4cqif4ke5j0ejjcvotcjquh33flk0mtv.apps.googleusercontent.com'}"
`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const runAiDiagnostic = async () => {
    setIsTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) {
        throw new Error(`Servidor respondió con código HTTP ${res.status}`);
      }
      const data = await res.json();
      setAiTestResult({
        ok: true,
        message: data.hasGeminiKey
          ? '¡Excelente! El backend de IA está activo y cuenta con GEMINI_API_KEY configurada.'
          : 'Backend activo, pero falta configurar la variable GEMINI_API_KEY en tu entorno.',
        details: data,
      });
    } catch (err: any) {
      setAiTestResult({
        ok: false,
        message: err.message || 'No se pudo contactar al endpoint /api/health.',
      });
    } finally {
      setIsTestingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                Despliegue en Vercel: IA y Firestore
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
                  Guía Paso a Paso
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Solución exacta para habilitar Google Gemini y la base de datos Firestore en tu proyecto Vercel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 gap-2 pt-2 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('solution')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'solution'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>1. ¿Por qué no corrían y cómo se soluciona?</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('variables')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'variables'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>2. Variables de Entorno (.env)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('domains')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'domains'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>3. Autorizar Dominio en Firebase</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diagnostic')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'diagnostic'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>4. Comprobar Estado</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-slate-300">
          {/* TAB 1: SOLUTION EXPLANATION */}
          {activeTab === 'solution' && (
            <div className="space-y-4">
              <div className="bg-blue-950/40 border border-blue-800/60 rounded-2xl p-4 text-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-300 text-sm">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Causa Exacta y lo que acabamos de preparar para ti</span>
                </div>
                <p className="leading-relaxed">
                  No te preocupes, esto le sucede a casi todos al desplegar en Vercel por primera vez. Vercel funciona de forma diferente a un servidor tradicional:
                </p>
              </div>

              {/* Problem 1: AI */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">
                    A
                  </div>
                  <h3 className="text-purple-300">¿Por qué fallaba la Inteligencia Artificial (Gemini) en Vercel?</h3>
                </div>
                <div className="pl-8 space-y-2 text-slate-400 leading-relaxed">
                  <p>
                    <strong className="text-slate-200">El motivo:</strong> Vercel es una plataforma para sitios web estáticos y no ejecuta servidores continuos como <code className="text-purple-300">server.ts</code>. Por eso, al llamar a <code className="text-purple-300">/api/gemini/...</code>, Vercel devolvía un error 404.
                  </p>
                  <p>
                    <strong className="text-emerald-400">La solución ya aplicada:</strong> Hemos creado la función Serverless oficial en <code className="text-emerald-400">/api/index.ts</code> y configurado <code className="text-emerald-400">vercel.json</code>. Ahora Vercel atiende automáticamente todas las peticiones de IA.
                  </p>
                  <p className="text-amber-300 bg-amber-950/30 p-2.5 rounded-xl border border-amber-800/40">
                    ⚡ <strong>Tu único paso pendiente:</strong> Agregar tu clave <code className="font-mono font-bold">GEMINI_API_KEY</code> en la sección de <em>Environment Variables</em> de tu proyecto en Vercel (ver pestaña 2).
                  </p>
                </div>
              </div>

              {/* Problem 2: Firestore */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">
                    B
                  </div>
                  <h3 className="text-amber-300">¿Por qué fallaba Firestore en Vercel?</h3>
                </div>
                <div className="pl-8 space-y-2 text-slate-400 leading-relaxed">
                  <p>
                    <strong className="text-slate-200">El motivo:</strong> Por seguridad estricta de Google, Firebase <strong>bloquea cualquier intento de inicio de sesión</strong> que provenga de una página web que no haya sido registrada previamente en la lista de dominios autorizados (error: <code className="text-rose-400">auth/unauthorized-domain</code>). Como no podías iniciar sesión, las reglas de Firestore bloqueaban el acceso a los datos.
                  </p>
                  <p>
                    <strong className="text-emerald-400">La solución (toma 60 segundos):</strong> Solo debes copiar el enlace de tu página en Vercel (ej: <code className="text-amber-300 font-mono">tu-app.vercel.app</code>) y pegarlo en <em>Firebase Console → Authentication → Configuración → Dominios autorizados</em> (ver pestaña 3).
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('variables')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <span>Siguiente: Ver Variables de Entorno</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ENVIRONMENT VARIABLES */}
          {activeTab === 'variables' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Variables de Entorno para Vercel</h3>
                  <p className="text-slate-400 text-xs">
                    Copia este bloque completo y pégalo directamente en Vercel.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(envSample, 'env-all')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all"
                >
                  {copiedKey === 'env-all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'env-all' ? '¡Copiado al Portapapeles!' : 'Copiar Todas las Variables'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                  <Terminal className="w-4 h-4" />
                  <span>¿Dónde se pegan en Vercel?</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-2 leading-relaxed">
                  <li>Ingresa a tu cuenta en <strong className="text-white">vercel.com</strong> y abre tu proyecto.</li>
                  <li>Ve a la pestaña superior <strong className="text-white">Settings</strong> (Configuración).</li>
                  <li>En el menú izquierdo, haz clic en <strong className="text-white">Environment Variables</strong>.</li>
                  <li>Haz clic en el recuadro y pega el texto copiado (Vercel detecta automáticamente los pares clave/valor).</li>
                  <li>Haz clic en <strong className="text-white">Save</strong> (Guardar).</li>
                  <li>Ve a la pestaña <strong>Deployments</strong> y pulsa los tres puntos <strong>(...) → Redeploy</strong> para que tome efecto.</li>
                </ol>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
                  {envSample}
                </pre>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('solution')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  ← Volver
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('domains')}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-600/20"
                >
                  <span>Siguiente: Dominios Autorizados de Firebase</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: AUTHORIZED DOMAINS */}
          {activeTab === 'domains' && (
            <div className="space-y-4">
              <div className="bg-amber-950/30 border border-amber-700/50 rounded-2xl p-4 text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Paso Crítico para que Firestore y Google Login funcionen en Vercel</span>
                </div>
                <p className="leading-relaxed text-xs">
                  Sin este paso, al hacer clic en "Iniciar Sesión con Google", la ventana de Google se cerrará con un error de dominio no autorizado.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">1</span>
                  Abre la Consola de Firebase
                </h4>
                <p className="text-slate-400 pl-7">
                  Accede a Firebase Console con la misma cuenta de Google con la que creaste la aplicación:
                </p>
                <div className="pl-7">
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
                  >
                    <span>Ir a Firebase Console</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">2</span>
                  Navega a la configuración de Dominios
                </h4>
                <div className="pl-7 space-y-1.5 text-slate-300">
                  <p>1. Selecciona tu proyecto: <strong className="text-indigo-400 font-mono">{safeConfig.projectId || 'project-61dda391-970c-4803-983'}</strong>.</p>
                  <p>2. En el menú de la izquierda, haz clic en <strong className="text-white">Authentication</strong> (o Compilación → Authentication).</p>
                  <p>3. En las pestañas de arriba, haz clic en <strong className="text-white">Settings</strong> (Configuración).</p>
                  <p>4. Haz clic en la opción <strong className="text-white">Authorized domains</strong> (Dominios autorizados).</p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">3</span>
                  Agrega tu Dominio de Vercel
                </h4>
                <p className="text-slate-400 pl-7">
                  Haz clic en el botón <strong className="text-white">"Add domain"</strong> (Agregar dominio) y escribe tu dominio de Vercel sin <code className="text-slate-500">https://</code> ni diagonales:
                </p>
                <div className="ml-7 bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-xs text-amber-300">
                    {currentHostname.includes('vercel.app') ? currentHostname : 'tu-proyecto.vercel.app'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        currentHostname.includes('vercel.app') ? currentHostname : 'tu-proyecto.vercel.app',
                        'dom-ex'
                      )
                    }
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'dom-ex' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 pl-7">
                  Tip: También puedes agregar <code className="text-slate-400">vercel.app</code> para que cualquier vista previa temporal de Vercel funcione sin configuración extra.
                </p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('variables')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  ← Volver a Variables
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('diagnostic')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <span>Probar Estado de Conexión</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DIAGNOSTIC & VERIFICATION */}
          {activeTab === 'diagnostic' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Diagnóstico del Servidor de Inteligencia Artificial (Gemini)</span>
                  </div>

                  <button
                    type="button"
                    disabled={isTestingAi}
                    onClick={runAiDiagnostic}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingAi ? 'animate-spin' : ''}`} />
                    <span>{isTestingAi ? 'Consultando...' : 'Probar Endpoint /api/health'}</span>
                  </button>
                </div>

                {aiTestResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                      aiTestResult.ok
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {aiTestResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      <span>{aiTestResult.message}</span>
                    </div>
                    {aiTestResult.details && (
                      <pre className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800 mt-2 overflow-x-auto">
                        {JSON.stringify(aiTestResult.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* Firebase Diagnostic */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Configuración Actual de Firebase</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Project ID:</span>
                    <span className="text-slate-200">{safeConfig.projectId || 'project-61dda391-970c-4803-983'}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Auth Domain:</span>
                    <span className="text-slate-200">{safeConfig.authDomain || 'project-61dda391-970c-4803-983.firebaseapp.com'}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">App ID:</span>
                    <span className="text-slate-200 truncate block">{safeConfig.appId || '1:275152670174:web:2c243c6f02e456b226214f'}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Dominio de ejecución actual:</span>
                    <span className="text-emerald-400 truncate block">{currentHostname || 'localhost'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Código 100% Adaptado para Vercel Serverless & Firebase</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Entendido, Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

