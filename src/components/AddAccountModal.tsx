import React, { useState } from 'react';
import { UserPlus, X, ArrowRight } from 'lucide-react';

interface AddAccountModalProps {
  onAddAccount: (email: string, name: string) => void;
  onClose: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ onAddAccount, onClose }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<'Personal' | 'Workspace (Educativo)' | 'Empresarial'>(
    'Personal'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onAddAccount(email.trim(), name.trim() || email.split('@')[0]);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-950/85 backdrop-blur-3xl rounded-[32px] p-6 sm:p-8 w-full max-w-md shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] border border-white/15 text-white space-y-5 animate-fadeIn relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Agregar cuenta de Google</h3>
              <p className="text-xs text-white/50">Inicia sesión con otra dirección de Gmail o Workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Dirección de correo electrónico *
            </label>
            <input
              type="email"
              required
              placeholder="ej. docente@gmail.com o edu.pa"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:bg-white/[0.08] focus:outline-hidden focus:border-purple-400 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Nombre Completo (Opcional)
            </label>
            <input
              type="text"
              placeholder="ej. Aníbal Castillo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:bg-white/[0.08] focus:outline-hidden focus:border-purple-400 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Tipo de cuenta
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as any)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-hidden focus:border-purple-400 cursor-pointer"
            >
              <option value="Personal" className="bg-slate-900 text-white">Personal (@gmail.com)</option>
              <option value="Workspace (Educativo)" className="bg-slate-900 text-white">Workspace Educativo (Colegio / MEDUCA)</option>
              <option value="Empresarial" className="bg-slate-900 text-white">Empresarial / Corporativo</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl bg-white/[0.05] hover:bg-white/10 text-xs font-semibold text-white/80 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-2xl bg-white text-black text-xs font-semibold hover:bg-gray-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] transition flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Agregando...</span>
                </>
              ) : (
                <>
                  <span>Vincular Cuenta</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
