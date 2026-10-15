import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  KeyRound, 
  CheckCircle2, 
  X,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  // Empty credentials by default for genuine professional presentation
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Active slide index for the visual carousel dots
  const [slideIndex, setSlideIndex] = useState(0);

  // Forgot Password Modal State
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: verify, 2: reset, 3: success
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [verifiedAccount, setVerifiedAccount] = useState(null);

  const slides = [
    {
      title: "Welcome to the workplace",
      sub: "Institutional attendance management & compliance audit"
    },
    {
      title: "Precision Shift Compliance",
      sub: "Automated punch reconciliation and supervisory approvals"
    },
    {
      title: "Executive Workforce Analytics",
      sub: "Real-time compliance audit and verified attendance sheets"
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = (form.email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      setError('Please enter your workplace email address.');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setError('A valid workplace email address is required (e.g. name@company.com). Username-only login is disabled.');
      return;
    }

    setLoading(true);

    try {
      await login({
        email: trimmedEmail,
        usernameOrEmail: trimmedEmail,
        password: form.password
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid workplace email or password.');
    } finally {
      setLoading(false);
    }
  };

  const openForgotModal = () => {
    setForgotOpen(true);
    setForgotStep(1);
    setForgotError('');
    setForgotEmail(form.email || '');
    setNewPassword('');
    setConfirmPassword('');
    setVerifiedAccount(null);
  };

  const handleVerifyAccount = async (e) => {
    e.preventDefault();
    setForgotError('');

    const trimmedEmail = (forgotEmail || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setForgotError('Please enter a valid workplace email address (e.g. name@company.com).');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await api.forgotPassword({
        email: trimmedEmail,
        emailOrUsername: trimmedEmail
      });
      if (res.success) {
        setVerifiedAccount(res);
        setForgotStep(2);
      }
    } catch (err) {
      setForgotError(err.message || 'No registered account found with that workplace email address.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await api.resetPassword({
        email: verifiedAccount.email,
        emailOrUsername: verifiedAccount.email || verifiedAccount.username,
        newPassword
      });

      if (res.success) {
        setForgotStep(3);
      }
    } catch (err) {
      setForgotError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleFinishReset = () => {
    setForm({
      email: verifiedAccount ? verifiedAccount.email : form.email,
      password: ''
    });
    setForgotOpen(false);
    setForgotStep(1);
    setError('');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F5EFF6] overflow-hidden select-none">
      {/* Subtle Atmospheric Watermark / Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#39333B]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#DFC090]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Outer Wrapper with Layered Offset Backdrop Card */}
      <div className="relative w-full max-w-4xl z-10">
        {/* Layered Offset Accent Card */}
        <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-full h-full rounded-[34px] sm:rounded-[38px] bg-[#39333B] -rotate-1 shadow-2xl opacity-90 transition-transform duration-300" />
        <div className="absolute -bottom-2 -right-2 w-full h-full rounded-[34px] sm:rounded-[38px] bg-[#DFC090]/40 rotate-1 shadow-lg pointer-events-none" />

        {/* Main Dual-Panel Split Card */}
        <div className="relative rounded-[30px] sm:rounded-[36px] bg-white border border-[#EADBEC] shadow-[0_20px_60px_-15px_rgba(57,51,59,0.3)] overflow-hidden flex flex-col md:flex-row">
          
          {/* ========================================================= */}
          {/* LEFT PANEL: Visual Showcase & Brand Artistry              */}
          {/* ========================================================= */}
          <div className="relative md:w-1/2 min-h-[380px] sm:min-h-[460px] md:min-h-[560px] bg-gradient-to-br from-[#2D232F] via-[#39333B] to-[#1F1721] p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
            {/* Ambient Lighting & Volumetric Atmosphere */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-[#DFC090]/15 via-[#DFC090]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-[#4A394D]/50 rounded-full blur-3xl pointer-events-none" />
            
            {/* Architectural Light Beam from Above */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-96 bg-gradient-to-b from-white/10 via-[#DFC090]/5 to-transparent -rotate-12 blur-2xl pointer-events-none" />

            {/* Top Brand Tag inside Left Panel */}
            <div className="relative z-10 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#DFC090] shadow-[0_0_10px_#DFC090]" />
              <span className="text-xs font-extrabold tracking-widest uppercase text-white">
                ATTEND<span className="text-[#DFC090]">EASE</span>
              </span>
            </div>

            {/* Center: Free-Floating Massive Custom Logo Artwork */}
            <div className="relative z-10 my-auto py-2 flex flex-col items-center justify-center -my-2 sm:-my-4">
              <div className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-[#DFC090]/30 via-[#39333B]/50 to-transparent blur-3xl pointer-events-none" />

              <div className="relative group cursor-pointer flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="AttendEase Emblem" 
                  className="w-72 h-72 sm:w-84 sm:h-84 md:w-[360px] md:h-[360px] lg:w-[410px] lg:h-[410px] object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.75)] hover:scale-105 transition-transform duration-500 select-none"
                />
              </div>
            </div>

            {/* Bottom: Floating Frosted Glass Card */}
            <div className="relative z-10">
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 sm:p-5 text-center shadow-xl transition-all">
                <p className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  {slides[slideIndex].title}
                </p>
                <p className="text-[11px] text-[#E8DFEC] mt-1 leading-relaxed">
                  {slides[slideIndex].sub}
                </p>

                {/* Carousel Pagination Dots */}
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSlideIndex(i)}
                      className={`transition-all duration-300 cursor-pointer ${
                        slideIndex === i 
                          ? 'w-6 h-1.5 rounded-full bg-[#DFC090] shadow-[0_0_8px_#DFC090]' 
                          : 'w-1.5 h-1.5 rounded-full bg-white/40 hover:bg-white/70'
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PANEL: Clean, High-End Minimalist Login Form        */}
          {/* ========================================================= */}
          <div className="md:w-1/2 p-8 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
            <div className="max-w-sm mx-auto w-full">
              
              {/* Form Title */}
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#39333B] tracking-tight">
                  Sign in to your workplace
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your institutional credentials to authenticate your shift.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Clean Professional Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Workplace Email Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Workplace Email Address
                    </label>
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
                      Email Required
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="e.g. ellica.onggoco@company.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50/70 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39333B]/15 focus:border-[#39333B] transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter your registered corporate email (<span className="font-mono text-slate-500">name@company.com</span>). Usernames are disabled.
                  </p>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={openForgotModal}
                      className="text-[11px] font-medium text-slate-400 hover:text-[#39333B] transition cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50/70 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39333B]/15 focus:border-[#39333B] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Continue / Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#39333B] hover:bg-[#4A3C4D] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </form>

              {/* Clean Institutional Security Footnote */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>End-to-End Encrypted Session • AttendEase Core</span>
              </div>

              {/* Technical / HR Support Note */}
              <p className="text-center text-[11px] text-slate-400 mt-3">
                Need account assistance?{' '}
                <button 
                  type="button" 
                  onClick={openForgotModal} 
                  className="text-[#39333B] font-bold hover:underline cursor-pointer"
                >
                  Reset your password
                </button>
              </p>

            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* FULLY FUNCTIONAL FORGOT PASSWORD MODAL                    */}
      {/* ========================================================= */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Close Button */}
            <button
              onClick={() => setForgotOpen(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 absolute top-5 right-5 cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Error Message inside Modal */}
            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* STEP 1: VERIFY WORKPLACE EMAIL */}
            {forgotStep === 1 && (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#39333B] text-[#DFC090] flex items-center justify-center mb-4 shadow-md">
                  <KeyRound className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Reset Workplace Password
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
                  Enter your registered workplace email address to verify your account in the attendance directory.
                </p>

                <form onSubmit={handleVerifyAccount} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Workplace Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. ellica.onggoco@company.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39333B]/15 focus:border-[#39333B] transition"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotOpen(false)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#39333B] hover:bg-[#4A3C4D] text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>{forgotLoading ? 'Verifying...' : 'Verify Account'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: SET NEW PASSWORD */}
            {forgotStep === 2 && (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center mb-4 shadow-sm">
                  <UserCheck className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Set New Password
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
                  Account verified for <strong className="text-slate-900">{verifiedAccount?.username}</strong> ({verifiedAccount?.email}). Please set your new secure password below:
                </p>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      New Password (min 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39333B]/15 focus:border-[#39333B] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39333B]/15 focus:border-[#39333B] transition"
                      />
                    </div>
                  </div>

                  {/* Password Requirements Checklist */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-700 flex items-center justify-between text-[11px]">
                      <span>Password Minimum Requirements:</span>
                      <span className={newPassword.length >= 6 ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                        {newPassword.length}/6 characters
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 text-[11px]">
                      <span className={`inline-flex items-center gap-1.5 ${newPassword.length >= 6 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${newPassword.length >= 6 ? 'text-emerald-600' : 'text-slate-300'}`} />
                        At least 6 characters (Required)
                      </span>
                      <span className={`inline-flex items-center gap-1.5 ${confirmPassword && newPassword === confirmPassword ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${confirmPassword && newPassword === confirmPassword ? 'text-emerald-600' : 'text-slate-300'}`} />
                        Passwords match exactly
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#39333B] hover:bg-[#4A3C4D] text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>{forgotLoading ? 'Updating...' : 'Update Password'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: SUCCESS CONFIRMATION */}
            {forgotStep === 3 && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-sm animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Password Successfully Updated!
                </h3>
                <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed max-w-xs mx-auto">
                  Your password has been successfully updated. You can now sign in with your new credentials.
                </p>

                <button
                  type="button"
                  onClick={handleFinishReset}
                  className="w-full py-3 px-4 rounded-xl bg-[#39333B] hover:bg-[#4A3C4D] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
