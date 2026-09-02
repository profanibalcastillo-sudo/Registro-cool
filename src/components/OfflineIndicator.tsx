import React, { useState } from 'react';
import { WifiOff, ShieldCheck, HardDrive, Info, X } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  if (isOnline) {
    return null;
  }

  return (
    <>
      {/* Floating Offline Toast / Banner */}
      {!isDismissed && (
        <div className="fixed bottom-4 left-4 z-40 max-w-sm rounded-2xl bg-slate-900/95 border border-amber-500/40 p-3.5 shadow-2xl backdrop-blur-md text-white animate-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <WifiOff className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300">Modo Sin Conexión (Offline)</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                Sin cobertura de internet. Todo tu trabajo se guarda de forma segura en tu dispositivo.
              </p>

              <div className="flex items-center gap-3 mt-2.5">
                <button
                  type="button"
                  onClick={() => setShowDetail(true)}
                  className="text-[10px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                >
                  Ver detalles de almacenamiento
                </button>
                <button
                  type="button"
                  onClick={() => setIsDismissed(true)}
                  className="text-[10px] text-slate-400 hover:text-white cursor-pointer ml-auto"
                >
                  Ocultar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <WifiOff className="w-5 h-5" />
                <span>Trabajando en Modo Local / Offline</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDetail(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>100% Operativo sin Internet</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  El Registro Digital Docente está diseñado para docentes en áreas de difícil acceso o sin cobertura celular. Puedes:
                </p>
                <ul className="text-[11px] text-slate-300 list-disc list-inside space-y-0.5 pt-1">
                  <li>Registrar asistencias diarias</li>
                  <li>Ingresar y promediar notas de los 3 trimestres</li>
                  <li>Consultar y editar planeamientos didácticos</li>
                  <li>Gestionar períodos y alarmas de clase</li>
                  <li>Crear respaldos locales en archivo JSON</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-200 flex items-start gap-2.5">
                <HardDrive className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Tus datos se mantienen en la memoria local persistente de tu navegador. Cuando vuelvas a tener señal, se sincronizarán con la nube si tienes una cuenta vinculada.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDetail(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
            >
              Continuar Trabajando
            </button>
          </div>
        </div>
      )}
    </>
  );
};
