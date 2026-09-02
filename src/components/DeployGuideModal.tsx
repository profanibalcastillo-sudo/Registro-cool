import React, { useState } from 'react';
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
  Terminal,
  Layers,
  Sparkles,
} from 'lucide-react';
import bundledConfig from '../../firebase-applet-config.json';

interface DeployGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployGuideModal: React.FC<DeployGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const safeConfig: any = bundledConfig;
  const envSample = `# --- CONFIGURACIÓN DE GEMINI AI (OPCIONAL) ---
GEMINI_API_KEY="Tu_Clave_de_Google_Gemini_API"

# --- CONFIGURACIÓN DE FIREBASE (OPCIONAL PARA MODO NUBE) ---
# Nota: La aplicación funciona 100% en modo local y offline sin necesidad de internet.
VITE_FIREBASE_PROJECT_ID="${safeConfig.projectId || 'tu-proyecto-id'}"
VITE_FIREBASE_APP_ID="${safeConfig.appId || 'tu-app-id'}"
VITE_FIREBASE_API_KEY="TU_FIREBASE_API_KEY_AQUI"
VITE_FIREBASE_AUTH_DOMAIN="${safeConfig.authDomain || 'tu-proyecto.firebaseapp.com'}"
VITE_FIREBASE_DATABASE_ID="${safeConfig.firestoreDatabaseId || 'tu-database-id'}"
VITE_FIREBASE_STORAGE_BUCKET="${safeConfig.storageBucket || 'tu-proyecto.firebasestorage.app'}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${safeConfig.messagingSenderId || 'tu-messaging-sender-id'}"
`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 border border-slate-600 text-white flex items-center justify-center shadow-lg">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Exportar a GitHub y Desplegar en Vercel
              </h2>
              <p className="text-xs text-slate-400">
                Guía completa para publicar tu Registro Digital MEDUCA con Firebase y Gemini AI
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-slate-300">
          {/* Step 1 */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                1
              </div>
              <h3 className="text-sm">Subir el Proyecto a tu GitHub</h3>
            </div>
            <p className="text-slate-400 pl-8">
              Puedes exportar el código ZIP desde el menú superior de Google AI Studio o sincronizarlo con tu cuenta de GitHub.
            </p>
            <div className="ml-8 bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
              <p>git init</p>
              <p>git add .</p>
              <p>git commit -m "Registro Digital MEDUCA con Firebase y Gemini AI"</p>
              <p>git branch -M main</p>
              <p>git remote add origin https://github.com/TU_USUARIO/registro-digital-meduca.git</p>
              <p>git push -u origin main</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                2
              </div>
              <h3 className="text-sm">Importar el Repositorio en Vercel</h3>
            </div>
            <p className="text-slate-400 pl-8">
              1. Ingresa a <strong className="text-white">vercel.com</strong> e inicia sesión con tu cuenta de GitHub.
              <br />
              2. Haz clic en <strong className="text-white">"Add New Project"</strong> y selecciona tu repositorio.
              <br />
              3. Vercel detectará automáticamente la configuración de Vite + React gracias al archivo <strong className="text-blue-400 font-mono">vercel.json</strong> que ya hemos incluido.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                  3
                </div>
                <h3 className="text-sm">Configurar Variables de Entorno en Vercel</h3>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(envSample, 'env-copy')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
              >
                {copiedKey === 'env-copy' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar .env Completo</span>
              </button>
            </div>
            <p className="text-slate-400 pl-8">
              En la pestaña <em>"Environment Variables"</em> de tu proyecto en Vercel, pega las siguientes variables:
            </p>
            <div className="ml-8 bg-slate-900 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto whitespace-pre">
              {envSample}
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">
                4
              </div>
              <h3 className="text-sm">Habilitar el Dominio de Vercel en Firebase Console</h3>
            </div>
            <p className="text-slate-400 pl-8">
              Para que el inicio de sesión con Google funcione en tu nuevo enlace de Vercel (ej: <code className="text-amber-300">mi-registro.vercel.app</code>):
              <br />
              1. Ve a <strong>Firebase Console → Authentication → Settings → Authorized Domains</strong>.
              <br />
              2. Agrega tu dominio de Vercel (<code className="text-amber-300">tu-app.vercel.app</code>).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Listo para GitHub & Vercel</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
