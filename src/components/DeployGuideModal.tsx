import React, { useState } from 'react';
import {
  Globe,
  Key,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Database,
  Download,
  FolderSync,
} from 'lucide-react';

interface DeployGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployGuideModal: React.FC<DeployGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'solution' | 'variables' | 'storage' | 'diagnostic'>('solution');

  // Diagnostic state
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ ok: boolean; message: string; details?: any } | null>(null);

  if (!isOpen) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const envSample = `# =======================================================
# VARIABLE PARA LA INTELIGENCIA ARTIFICIAL GEMINI (SERVERLESS VERCEL)
# Obtén tu clave gratuita en: https://aistudio.google.com/app/apikey
# =======================================================
GEMINI_API_KEY="AIzaSy..."
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
        throw new Error(`El servidor respondió con código HTTP ${res.status}`);
      }
      const data = await res.json();
      setAiTestResult({
        ok: true,
        message: data.hasGeminiKey
          ? '¡Excelente! El backend de Inteligencia Artificial está activo y cuenta con GEMINI_API_KEY configurada.'
          : 'Backend activo, pero falta agregar la clave GEMINI_API_KEY en las variables de Vercel.',
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
                Despliegue en Vercel (Sin Firebase)
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
                  100% Simplificado
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tu app ahora es autónoma, rápida y funciona en Vercel con solo la clave de Google Gemini
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
            <span>1. Ventajas de Eliminar Firebase</span>
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
            <span>2. Única Variable Vercel (GEMINI_API_KEY)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'storage'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>3. Datos y Copias de Seguridad</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diagnostic')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'diagnostic'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>4. Comprobar IA en Vivo</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-slate-300">
          {/* TAB 1: SOLUTION EXPLANATION */}
          {activeTab === 'solution' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4 text-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>¡Firebase ha sido eliminado por completo con éxito!</span>
                </div>
                <p className="leading-relaxed">
                  Ya no necesitas configurar proyectos en Firebase Console, ni lidiar con dominios no autorizados, ni configurar reglas de seguridad complejas de Firestore.
                </p>
              </div>

              {/* Problem 1: AI */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">
                    1
                  </div>
                  <h3 className="text-purple-300">¿Cómo corre la Inteligencia Artificial (Gemini) en Vercel?</h3>
                </div>
                <div className="pl-8 space-y-2 text-slate-400 leading-relaxed">
                  <p>
                    <strong className="text-slate-200">Función Serverless Vercel:</strong> El proyecto incluye el archivo <code className="text-purple-300">/api/index.ts</code> y la configuración oficial <code className="text-purple-300">vercel.json</code>.
                  </p>
                  <p>
                    Al desplegar en Vercel, la IA atiende las peticiones de planeamientos, rúbricas y criterios en el endpoint <code className="text-emerald-400">/api/gemini/generate</code> de manera automática.
                  </p>
                  <p className="text-emerald-300 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-800/40">
                    ⚡ <strong>Único requisito:</strong> Colocar tu <code className="font-mono font-bold">GEMINI_API_KEY</code> en las Variables de Entorno de Vercel.
                  </p>
                </div>
              </div>

              {/* Problem 2: Data */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                    2
                  </div>
                  <h3 className="text-blue-300">¿Dónde se guardan las notas, estudiantes y planeamientos?</h3>
                </div>
                <div className="pl-8 space-y-2 text-slate-400 leading-relaxed">
                  <p>
                    Tus datos se almacenan de manera local y encriptada directamente en tu navegador (LocalStorage) con snapshots automáticos ante cada cambio.
                  </p>
                  <p>
                    Además, tienes a disposición la descarga de copias de seguridad en formato <strong>JSON</strong> y la sincronización opcional con <strong>Google Drive</strong> sin depender de Firebase.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('variables')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <span>Siguiente: Ver Variable GEMINI_API_KEY</span>
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
                  <h3 className="text-sm font-bold text-white">Única Variable Requerida para Vercel</h3>
                  <p className="text-slate-400 text-xs">
                    Solo necesitas agregar tu clave de Gemini. Sin variables de Firebase ni credenciales complejas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy('GEMINI_API_KEY', 'key-name')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all"
                >
                  {copiedKey === 'key-name' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'key-name' ? '¡Copiado!' : 'Copiar Nombre'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                  <Terminal className="w-4 h-4" />
                  <span>Pasos para agregarla en Vercel (1 minuto):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-2 leading-relaxed">
                  <li>Ingresa a tu cuenta en <strong className="text-white">vercel.com</strong> y entra en tu proyecto.</li>
                  <li>Haz clic en la pestaña superior <strong className="text-white">Settings</strong>.</li>
                  <li>En el menú lateral izquierdo, haz clic en <strong className="text-white">Environment Variables</strong>.</li>
                  <li>
                    En <strong className="text-white">Key</strong> escribe: <code className="text-emerald-400 font-mono font-bold">GEMINI_API_KEY</code>
                  </li>
                  <li>
                    En <strong className="text-white">Value</strong> pega tu clave de Google AI Studio (inicia con <code className="text-slate-400">AIzaSy...</code>).
                  </li>
                  <li>Haz clic en <strong className="text-white">Save</strong>.</li>
                  <li>Ve a <strong className="text-white">Deployments</strong> y pulsa <strong className="text-white">Redeploy</strong>. ¡Listo!</li>
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
                  onClick={() => setActiveTab('storage')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <span>Siguiente: Copias de Seguridad</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: STORAGE & BACKUPS */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div className="bg-blue-950/40 border border-blue-700/50 rounded-2xl p-4 text-blue-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-300 text-sm">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span>Seguridad y Portabilidad Total de tus Datos Académicos</span>
                </div>
                <p className="leading-relaxed text-xs">
                  Al no depender de Firestore, tus calificaciones y alumnos te pertenecen al 100% y nunca quedarán bloqueados por límites de cuota de bases de datos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Copias JSON Descargables</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Puedes exportar en cualquier momento un archivo <code className="text-emerald-300">.json</code> completo con todos tus trimestres, planeamientos y asistencias.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <FolderSync className="w-4 h-4 text-indigo-400" />
                    <span>Snapshots Automáticos Locales</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    El sistema guarda hasta 10 puntos de restauración automáticos en tu navegador para que puedas volver en el tiempo si borras algo por accidente.
                  </p>
                </div>
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
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
                >
                  <span>Probar Estado de la IA</span>
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

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Estado de la Aplicación</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Arquitectura:</span>
                    <span className="text-emerald-400 font-semibold">Local-First + Vercel Serverless</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Firebase / Firestore:</span>
                    <span className="text-slate-300 font-semibold">Eliminado (0 dependencias externas)</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Dominio actual:</span>
                    <span className="text-indigo-300 truncate block">{currentHostname || 'localhost'}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Almacenamiento:</span>
                    <span className="text-emerald-400 font-semibold">LocalStorage + Respaldo JSON</span>
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
            <span>Código 100% Autónomo y Optimizado para Vercel</span>
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
