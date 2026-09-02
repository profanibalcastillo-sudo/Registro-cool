import React, { useState, useRef, useEffect } from 'react';
import { Settings, Save, X, Eraser, CheckCircle2, ShieldCheck, HardDrive, ArrowRight } from 'lucide-react';

interface TeacherSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherInfo: {
    name: string;
    email: string;
    school?: string;
    schoolName?: string;
    region?: string;
    circuit?: string;
    signatureDataUrl?: string;
  };
  onSaveTeacherInfo: (info: {
    name: string;
    email: string;
    school: string;
    schoolName: string;
    region: string;
    signatureDataUrl?: string;
  }) => void;
  onOpenBackupModal?: () => void;
}

export const TeacherSignatureModal: React.FC<TeacherSignatureModalProps> = ({
  isOpen,
  onClose,
  teacherInfo,
  onSaveTeacherInfo,
  onOpenBackupModal,
}) => {
  const getInitialSchool = () => teacherInfo.school || teacherInfo.schoolName || '';

  const [info, setInfo] = useState({
    name: teacherInfo.name || '',
    email: teacherInfo.email || '',
    school: getInitialSchool(),
    schoolName: getInitialSchool(),
    region: teacherInfo.region || '',
    signatureDataUrl: teacherInfo.signatureDataUrl || '',
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentSchool = teacherInfo.school || teacherInfo.schoolName || '';
      setInfo({
        name: teacherInfo.name || '',
        email: teacherInfo.email || '',
        school: currentSchool,
        schoolName: currentSchool,
        region: teacherInfo.region || '',
        signatureDataUrl: teacherInfo.signatureDataUrl || '',
      });
    }
  }, [teacherInfo, isOpen]);

  useEffect(() => {
    if (isOpen && canvasRef.current && teacherInfo.signatureDataUrl) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = teacherInfo.signatureDataUrl;
      }
    }
  }, [isOpen, teacherInfo.signatureDataUrl]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2563eb';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setInfo({ ...info, signatureDataUrl: '' });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let sigUrl = info.signatureDataUrl;
    if (canvasRef.current) {
      sigUrl = canvasRef.current.toDataURL('image/png');
    }
    const cleanSchool = (info.school || info.schoolName || '').trim();
    onSaveTeacherInfo({
      ...info,
      school: cleanSchool,
      schoolName: cleanSchool,
      signatureDataUrl: sigUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Datos del Docente & Centro Educativo
              </h3>
              <p className="text-xs text-slate-400">
                Información para encabezados, barra superior y actas oficiales MEDUCA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Nombre Completo:</label>
            <input
              type="text"
              required
              value={info.name}
              onChange={(e) => setInfo({ ...info, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Correo Electrónico:</label>
              <input
                type="email"
                required
                value={info.email}
                onChange={(e) => setInfo({ ...info, email: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Región Educativa:</label>
              <input
                type="text"
                value={info.region}
                onChange={(e) => setInfo({ ...info, region: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Centro Educativo (Escuela / Colegio / Instituto):
            </label>
            <input
              type="text"
              required
              placeholder="ej. C.E.B.G. Alto Boquete"
              value={info.school}
              onChange={(e) =>
                setInfo({ ...info, school: e.target.value, schoolName: e.target.value })
              }
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Este nombre se mostrará en la barra superior, actas oficiales, planes didácticos y reportes.
            </p>
          </div>

          {/* Signature Canvas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300">
                Firma Digital (para actas y registros):
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
              >
                <Eraser className="w-3 h-3" />
                <span>Limpiar</span>
              </button>
            </div>

            <div className="border border-slate-700 rounded-2xl bg-white p-2">
              <canvas
                ref={canvasRef}
                width={400}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[100px] cursor-crosshair touch-none"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Dibuja tu firma arriba usando el mouse o tu pantalla táctil.
            </p>
          </div>

          {/* Backup / Export / Import Shortcut */}
          {onOpenBackupModal && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Respaldo y Recuperación de Datos</div>
                  <div className="text-[10px] text-slate-400">
                    Exporta e importa respaldos .JSON y gestiona copias locales.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBackupModal();
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Abrir</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Información</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
