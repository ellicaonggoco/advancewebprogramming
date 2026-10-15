import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, LogIn, LogOut, CheckCircle2, AlertCircle, MapPin, RotateCcw, X, ShieldAlert, Timer, Award, Lock, ShieldCheck, FileText } from 'lucide-react';
import { api, getLocalDateString } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TimeClockWidget({ onClockEvent }) {
  const { user, isAdmin } = useAuth();
  const [time, setTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState(null);
  const [todayOtRecord, setTodayOtRecord] = useState(null);
  const [otAuth, setOtAuth] = useState(null);
  const [authReason, setAuthReason] = useState('Approved Project Sprint / Operational Requirement');
  const [authAllWorkforce, setAuthAllWorkforce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState(null);

  // 2nd Verification Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const todayStr = getLocalDateString(new Date());
      const myEmpId = user?.employee?.id || user?.employee?._id;

      const [res, authRes] = await Promise.all([
        api.getAttendance({ date: todayStr }),
        api.getOvertimeAuthorizations({ date: todayStr, employeeId: myEmpId }).catch(() => ({ success: false }))
      ]);

      if (res.success && res.data) {
        const myRecords = res.data.filter(r => r.employee && (r.employee.id === myEmpId || r.employee._id === myEmpId));

        const regular = myRecords.find(r => r.session !== 'Overtime' && r.status !== 'Overtime');
        const ot = myRecords.find(r => r.session === 'Overtime' || r.status === 'Overtime');

        setTodayRecord(regular || null);
        setTodayOtRecord(ot || null);
      }

      if (authRes?.success && authRes.data) {
        const valid = authRes.data.find(a => a.status === 'Authorized');
        setOtAuth(valid || null);
      } else {
        setOtAuth(null);
      }
    } catch (err) {
      console.warn('Failed to fetch today record:', err);
    }
  };

  useEffect(() => {
    if (user?.employee) {
      fetchTodayStatus();
    }
  }, [user]);

  // Trigger para sa Regular Clock-In:
  // Nagpapadala ng request sa backend para i-log ang start ng shift sa Asia/Manila time
  const executeClockIn = async () => {
    setConfirmModal({ open: false, type: null });
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.clockIn({ notes });
      setFeedback({ type: 'success', message: res.message });
      setNotes('');
      await fetchTodayStatus();
      if (onClockEvent) onClockEvent();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Trigger para sa Regular Clock-Out:
  // Nagpapadala ng request sa backend kung saan kusa nitong iko-compute ang kabuuang oras ng shift at status
  const executeClockOut = async () => {
    setConfirmModal({ open: false, type: null });
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.clockOut({ notes });
      setFeedback({ type: 'success', message: res.message });
      setNotes('');
      await fetchTodayStatus();
      if (onClockEvent) onClockEvent();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const executeClockInOt = async () => {
    setConfirmModal({ open: false, type: null });
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.clockIn({ notes, isOvertime: true });
      setFeedback({ type: 'success', message: res.message });
      setNotes('');
      await fetchTodayStatus();
      if (onClockEvent) onClockEvent();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const executeAuthorizeOt = async () => {
    setConfirmModal({ open: false, type: null });
    setLoading(true);
    setFeedback(null);
    try {
      const myEmpId = user?.employee?.id || user?.employee?._id;
      const res = await api.authorizeOvertime({
        employeeId: myEmpId,
        date: getLocalDateString(new Date()),
        reason: authReason,
        allEmployees: authAllWorkforce,
        maxHours: 4
      });
      setFeedback({ type: 'success', message: res.message });
      await fetchTodayStatus();
      if (onClockEvent) onClockEvent();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const executeRevokeOt = async () => {
    if (!otAuth) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.revokeOvertimeAuth(otAuth.id || otAuth._id);
      setFeedback({ type: 'success', message: res.message });
      setOtAuth(null);
      await fetchTodayStatus();
      if (onClockEvent) onClockEvent();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const executeResetToday = async () => {
    setConfirmModal({ open: false, type: null });
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.resetTodayAttendance();
      setFeedback({ type: 'success', message: res.message });
      setTodayRecord(null);
      setTodayOtRecord(null);
      if (onClockEvent) onClockEvent();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#231E26] via-[#1B171E] to-[#131115] text-white p-6 sm:p-7 border border-[#4A3D4F]/80 shadow-2xl shadow-black/25">
        {/* Ambient atmospheric highlights */}
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[#DFC090]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left: Clock Details */}
          <div className="flex items-center gap-4 text-left w-full md:w-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#39333B] to-[#241F27] border border-[#5A4860] flex items-center justify-center text-[#DFC090] shadow-lg shrink-0">
              <Clock className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.8]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider text-[#DFC090] uppercase">
                  Workforce Shift Clock
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-white mt-0.5 drop-shadow-sm">
                {time.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-300 mt-1">
                <span className="font-semibold text-zinc-200">
                  {time.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-zinc-600">•</span>
                <div className="flex items-center gap-1 text-zinc-400 text-[11px]">
                  <MapPin className="w-3 h-3 text-[#DFC090]" />
                  <span>Standard Shift: 9:00 AM – 5:00 PM (15m Grace)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Clock Actions */}
          <div className="flex flex-col items-stretch sm:items-end gap-3 w-full md:w-auto">
            {/* Case 1: Unclocked today */}
            {!todayRecord?.timeIn ? (
              <div className="flex flex-col items-stretch sm:items-end w-full sm:w-auto">
                <button
                  onClick={() => setConfirmModal({ open: true, type: 'clockIn' })}
                  disabled={loading}
                  className="group relative w-full sm:w-auto px-7 py-3.5 sm:px-8 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-3.5 shadow-xl shadow-emerald-950/70 ring-4 ring-emerald-500/25 hover:ring-emerald-400/50 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center shrink-0 transition-all shadow-inner">
                    <LogIn className="w-5 h-5 text-white stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm sm:text-base font-extrabold leading-tight tracking-tight">
                      {loading ? 'Recording Time-In...' : 'Record Time-In'}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-emerald-100/90 font-medium tracking-normal">
                      Standard Shift Attendance (9:00 AM – 5:00 PM)
                    </div>
                  </div>
                </button>
              </div>
            ) : !todayRecord?.timeOut ? (
              /* Case 2: On Regular Shift */
              <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Clocked in at <strong className="font-mono text-white">{todayRecord.timeIn}</strong> {todayRecord.status === 'Late' ? '(Late)' : ''}</span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={() => setConfirmModal({ open: true, type: 'clockOut' })}
                    disabled={loading}
                    className="group relative flex-1 sm:flex-initial px-7 py-3.5 sm:px-8 sm:py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:via-rose-500 hover:to-red-600 text-white font-bold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-3.5 shadow-xl shadow-red-950/70 ring-4 ring-red-500/25 hover:ring-red-400/50 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center shrink-0 transition-all shadow-inner">
                      <LogOut className="w-5 h-5 text-white stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm sm:text-base font-extrabold leading-tight tracking-tight">
                        {loading ? 'Recording Time-Out...' : 'Record Time-Out'}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-rose-100/90 font-medium tracking-normal">
                        End of Regular Shift
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              /* Case 3: Regular Shift Completed & Saved Permanently */
              <div className="flex flex-col items-stretch sm:items-end gap-3 w-full sm:w-auto">
                {/* Completed Regular Shift Badge */}
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold tracking-wide shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Regular Shift Saved • {todayRecord.workHours}h logged ({todayRecord.timeIn} → {todayRecord.timeOut})</span>
                  </div>

                  {todayOtRecord?.timeOut && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-[11px] font-semibold tracking-wide shadow-sm">
                      <Timer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Overtime: {todayOtRecord.workHours}h ({todayOtRecord.timeIn} → {todayOtRecord.timeOut})</span>
                    </div>
                  )}
                </div>

                {/* Overtime Actions */}
                {!todayOtRecord?.timeIn ? (
                  /* Admin can clock in for Overtime directly. Regular employees require admin mandate */
                  isAdmin || otAuth ? (
                    <div className="flex flex-col items-stretch sm:items-end gap-2.5 w-full sm:w-auto">
                      {!isAdmin && otAuth && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-300 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>OT Mandate Active • Authorized by <strong className="text-white">{otAuth.authorizedBy || 'Admin'}</strong></span>
                        </div>
                      )}

                      <button
                        onClick={() => setConfirmModal({ open: true, type: 'clockInOt' })}
                        disabled={loading}
                        className="group relative px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:via-amber-400 hover:to-yellow-400 text-zinc-950 font-bold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-3 shadow-xl shadow-amber-950/50 ring-4 ring-amber-400/25 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="w-8 h-8 rounded-xl bg-black/10 group-hover:bg-black/15 flex items-center justify-center shrink-0 transition-all shadow-inner">
                          <Timer className="w-4 h-4 text-zinc-950 stroke-[2.2]" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs sm:text-sm font-extrabold leading-tight">
                            Record Overtime In
                          </div>
                          <div className="text-[10px] text-zinc-900/80 font-medium">
                            Authorized Overtime Duty
                          </div>
                        </div>
                      </button>
                    </div>
                  ) : (
                    /* Locked state for regular employees whose OT is not authorized yet */
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 text-left max-w-sm shadow-md">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-200">
                          Overtime Requires Admin Mandate
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          Overtime duty must be authorized by an Administrator before clocking in.
                        </div>
                      </div>
                    </div>
                  )
                ) : !todayOtRecord?.timeOut ? (
                  /* User is currently ON OVERTIME SHIFT */
                  <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-2 text-xs text-amber-300">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      <span>Active Overtime Session • Clocked in at <strong className="font-mono text-white">{todayOtRecord.timeIn}</strong></span>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        onClick={() => setConfirmModal({ open: true, type: 'clockOutOt' })}
                        disabled={loading}
                        className="group relative flex-1 sm:flex-initial px-7 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:via-rose-500 hover:to-red-600 text-white font-bold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-red-950/70 ring-4 ring-red-500/25 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="w-8 h-8 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center shrink-0">
                          <LogOut className="w-4 h-4 text-white stroke-[2.2]" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs sm:text-sm font-extrabold leading-tight">
                            Record Overtime Out
                          </div>
                          <div className="text-[10px] text-red-100/90 font-medium">
                            End of Overtime Duty
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Both Regular and Overtime are completed */
                  <div className="flex items-center gap-2.5 flex-wrap justify-end">
                    <div className="px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-xs text-zinc-300 font-medium flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-[#DFC090]" />
                      <span>Total Day Credited: <strong className="text-white font-mono">{(Number(todayRecord.workHours) + Number(todayOtRecord.workHours)).toFixed(2)} hrs</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {feedback && (
          <div className={`mt-4 pt-3 border-t border-zinc-800/80 text-xs flex items-center gap-2 ${
            feedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        {/* Quick link for adjustment & Discreet Admin Testing Override */}
        <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
            <ShieldAlert className="w-3.5 h-3.5 text-[#DFC090] shrink-0" />
            <span>Missed a punch or noticed a shift discrepancy?</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/attendance?tab=adjustments&action=new"
              className="text-[#DFC090] hover:text-[#f3ddb8] font-semibold text-xs inline-flex items-center gap-1.5 transition hover:underline cursor-pointer"
            >
              <span>Request Time Adjustment</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2nd Verification / Confirmation Modals */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 relative text-left">
            <button
              onClick={() => setConfirmModal({ open: false, type: null })}
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 1. Time-In Modal */}
            {confirmModal.type === 'clockIn' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <LogIn className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">Confirm Shift Time-In</h3>
                    <p className="text-xs text-zinc-500">2nd Verification • Workplace Attendance</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Staff Member:</span>
                    <span className="font-semibold text-zinc-900">
                      {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.username}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Recorded Timestamp:</span>
                    <span className="font-mono font-semibold text-emerald-700 text-sm">
                      {time.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Official Date:</span>
                    <span className="font-medium text-zinc-800">
                      {time.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Entry Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. On-site office, client workstation..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmModal({ open: false, type: null })}
                    className="px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeClockIn}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{loading ? 'Confirming...' : 'Yes, Confirm Time-In'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. Regular Time-Out Modal */}
            {confirmModal.type === 'clockOut' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <LogOut className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">Confirm Shift Time-Out</h3>
                    <p className="text-xs text-zinc-500">2nd Verification • End of Regular Shift</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Time-In Recorded At:</span>
                    <span className="font-mono font-medium text-zinc-800">{todayRecord?.timeIn || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Time-Out Timestamp:</span>
                    <span className="font-mono font-semibold text-red-700 text-sm">
                      {time.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 pt-1 border-t border-zinc-200/70">
                    Confirming will record your shift departure and compute total hours worked today.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    End-of-Day Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Standard shift completed, sprint work done..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmModal({ open: false, type: null })}
                    className="px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeClockOut}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{loading ? 'Confirming...' : 'Yes, Confirm Time-Out'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Overtime Time-In Modal */}
            {confirmModal.type === 'clockInOt' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Timer className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">Record Overtime Time-In</h3>
                    <p className="text-xs text-zinc-500">2nd Verification • Authorized Overtime Duty</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-900 font-medium">Regular Shift:</span>
                    <span className="font-semibold text-emerald-700">Completed ({todayRecord?.timeIn} – {todayRecord?.timeOut})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-900 font-medium">Overtime Time-In:</span>
                    <span className="font-mono font-bold text-amber-800 text-sm">
                      {time.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900/80 pt-1 border-t border-amber-200/70">
                    This records a dedicated Overtime session for additional duty. Your earlier regular shift is preserved in full.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Overtime Reason / Project (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Urgent deployment, inventory audit, supervisor request..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmModal({ open: false, type: null })}
                    className="px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeClockInOt}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Timer className="w-3.5 h-3.5 text-zinc-950" />
                    <span>{loading ? 'Confirming...' : 'Yes, Record Overtime In'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. Overtime Time-Out Modal */}
            {confirmModal.type === 'clockOutOt' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <LogOut className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">Confirm Overtime Time-Out</h3>
                    <p className="text-xs text-zinc-500">2nd Verification • End of Overtime Duty</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-red-950 font-medium">Overtime Started At:</span>
                    <span className="font-mono font-medium text-red-950">{todayOtRecord?.timeIn || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-950 font-medium">Overtime Ended At:</span>
                    <span className="font-mono font-bold text-red-700 text-sm">
                      {time.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </span>
                  </div>
                  <p className="text-[11px] text-red-900/80 pt-1 border-t border-red-200/70">
                    Overtime duration will be computed and credited to your official attendance records.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Overtime Completion Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Server updates concluded successfully..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmModal({ open: false, type: null })}
                    className="px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeClockOut}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{loading ? 'Confirming...' : 'Yes, Confirm OT Time-Out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
