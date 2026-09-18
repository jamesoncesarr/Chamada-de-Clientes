import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Mail,
  ChevronLeft,
} from 'lucide-react';
import { Operator } from '../types';

interface LoginViewProps {
  operators: Operator[];
  onLoginSuccess: (operator: Operator) => void;
  onSetPasswordAndLogin: (operatorId: string, newPassword: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  operators,
  onLoginSuccess,
  onSetPasswordAndLogin,
}) => {
  // Input states
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // First access / Password reset state
  const [pendingOperator, setPendingOperator] = useState<Operator | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanEmail) {
      setErrorMessage('Por favor, informe seu e-mail de acesso cadastrado.');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Por favor, informe sua senha.');
      return;
    }

    // 1. Verify if user is registered
    const matchedOperator = operators.find(
      (op) => op.email && op.email.trim().toLowerCase() === cleanEmail
    );

    if (!matchedOperator) {
      setErrorMessage(
        'E-mail não cadastrado no sistema. Somente usuários cadastrados pela Administração têm acesso. Solicite seu cadastro a Jameson Cesar (Admin).'
      );
      return;
    }

    // 2. Determine valid password for this operator (default is '123')
    const validPassword = matchedOperator.password || '123';

    if (cleanPass !== validPassword) {
      setErrorMessage(
        'Senha incorreta. Verifique os dados digitados ou solicite o reset da sua senha ao Administrador Geral (Jameson Cesar).'
      );
      return;
    }

    // 3. Password matched! Check if first access or required password change
    const needsPasswordChange =
      matchedOperator.mustChangePassword ||
      !matchedOperator.passwordDefined ||
      validPassword === '123' ||
      cleanPass === '123';

    if (needsPasswordChange) {
      // Direct user to configure new personal password
      setPendingOperator(matchedOperator);
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      return;
    }

    // 4. Regular access - Login success
    setIsLoading(true);
    setSuccessMessage(`Bem-vindo, ${matchedOperator.name}! Carregando sistema...`);
    setTimeout(() => {
      onLoginSuccess(matchedOperator);
    }, 400);
  };

  const handleFirstAccessPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!pendingOperator) return;

    if (newPasswordInput.length < 4) {
      setErrorMessage('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    if (newPasswordInput === '123') {
      setErrorMessage('A nova senha não pode ser a senha inicial "123". Escolha uma senha pessoal segura.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setErrorMessage('As senhas não coincidem. Digite a mesma senha em ambos os campos.');
      return;
    }

    setIsLoading(true);
    setSuccessMessage('Senha cadastrada com sucesso! Entrando na sua conta...');
    setTimeout(() => {
      onSetPasswordAndLogin(pendingOperator.id, newPasswordInput);
    }, 500);
  };

  const handleBackToLogin = () => {
    setPendingOperator(null);
    setPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* LEFT HALF: DARK BLUE - APENAS "Chamada de Clientes" */}
      <div className="w-full lg:w-1/2 min-h-[220px] lg:min-h-screen bg-[#07132b] flex items-center justify-center p-8 sm:p-12 relative overflow-hidden">
        {/* Subtle atmospheric glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight text-center z-10 select-none drop-shadow-sm">
          Chamada de Clientes
        </h1>
      </div>

      {/* RIGHT HALF: WHITE - ÁREA DE LOGIN */}
      <div className="w-full lg:w-1/2 min-h-[calc(100vh-220px)] lg:min-h-screen bg-white flex flex-col justify-between p-6 sm:p-10 md:p-14 z-10">
        <div className="max-w-md w-full mx-auto my-auto py-8">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{successMessage}</span>
            </div>
          )}

          {!pendingOperator ? (
            /* STEP 1: EMAIL & PASSWORD LOGIN FORM */
            <div>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-4 shadow-2xs">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Acesso ao Sistema
                </h2>
                <p className="text-sm text-slate-500 mt-1.5">
                  Apenas usuários previamente cadastrados podem acessar.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>E-mail Cadastrado:</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Digite seu E-mail"
                      autoFocus
                      required
                      className="w-full pl-4 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                      <span>Senha de Acesso:</span>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Digite sua senha"
                      required
                      className="w-full pl-4 pr-11 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-3 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isLoading ? 'Entrando...' : 'Entrar no Sistema'}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </form>
            </div>
          ) : (
            /* STEP 2: FIRST ACCESS / RESET PASSWORD REQUIRED */
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  1º Acesso Obrigatório
                </span>
              </div>

              {/* User Identity Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3 mb-5">
                <div
                  className={`w-11 h-11 rounded-xl text-white font-black flex items-center justify-center text-sm shadow-2xs shrink-0 ${
                    pendingOperator.avatarColor || 'bg-blue-600'
                  }`}
                >
                  {pendingOperator.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-900 truncate">
                    {pendingOperator.name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {pendingOperator.email}
                  </p>
                  <span className="text-[11px] text-blue-700 font-semibold">
                    {pendingOperator.isAdmin ? 'Administrador Geral' : pendingOperator.role}
                  </span>
                </div>
              </div>

              <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <p className="leading-relaxed">
                  Por segurança, defina sua nova senha pessoal para continuar.
                </p>
              </div>

              <form onSubmit={handleFirstAccessPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Defina sua Nova Senha:
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Mínimo de 4 caracteres (diferente de 123)"
                      autoFocus
                      required
                      className="w-full pl-4 pr-11 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Confirme a Nova Senha:
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Digite novamente a nova senha"
                      required
                      className="w-full pl-4 pr-11 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-3 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isLoading ? 'Salvando Senha...' : 'Salvar Nova Senha e Entrar'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Information */}
        <div className="max-w-md w-full mx-auto pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Conexão Segura e Criptografada</span>
          </div>
          <span>v2.8 Cacique</span>
        </div>
      </div>
    </div>
  );
};

