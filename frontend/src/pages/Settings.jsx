import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Lock, 
  ShieldCheck, 
  Bell, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Building2, 
  Briefcase, 
  Clock, 
  Mail, 
  Phone, 
  FileText, 
  KeyRound, 
  Upload, 
  Trash2, 
  Camera 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import UserAvatar from '../components/UserAvatar';

export default function Settings() {
  const { user, updateUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    avatar: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Preferences State
  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    punchReminders: true,
    timeFormat: '12h',
    themeStyle: 'plum'
  });
  const [prefSuccess, setPrefSuccess] = useState('');

  // Populate initial values from auth user
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.employee?.firstName || '',
        lastName: user.employee?.lastName || '',
        email: user.email || user.employee?.email || '',
        phone: user.employee?.phone || '+63 917 123 4501',
        bio: user.employee?.bio || 'Workforce member in good standing under institutional compliance.',
        avatar: user.avatar || user.employee?.avatar || ''
      });
    }
  }, [user]);

  // Handle local image file selection and client-side optimization with INSTANT account sync
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 360;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setProfileForm(prev => ({ ...prev, avatar: optimizedDataUrl }));

        // Immediately connect & save to backend and AuthContext
        try {
          setProfileLoading(true);
          const res = await api.updateProfile({
            ...profileForm,
            avatar: optimizedDataUrl
          });
          if (res.success && res.user) {
            updateUser(res.user);
            if (user?.username) {
              localStorage.setItem(`attendance_avatar_${user.username}`, optimizedDataUrl);
            }
            setProfileSuccess('Profile picture connected and updated across your entire account!');
            setTimeout(() => setProfileSuccess(''), 4000);
          }
        } catch (err) {
          setProfileError(err.message || 'Failed to update profile picture.');
        } finally {
          setProfileLoading(false);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleResetAvatar = async () => {
    setProfileForm(prev => ({ ...prev, avatar: '' }));
    if (user?.username) {
      localStorage.removeItem(`attendance_avatar_${user.username}`);
    }
    try {
      setProfileLoading(true);
      const res = await api.updateProfile({
        ...profileForm,
        avatar: ''
      });
      if (res.success && res.user) {
        updateUser(res.user);
        setProfileSuccess('Profile picture reset to default monogram initials.');
        setTimeout(() => setProfileSuccess(''), 4000);
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to reset photo.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      const res = await api.updateProfile(profileForm);
      if (res.success && res.user) {
        updateUser(res.user);
        setProfileSuccess('Profile details and picture successfully updated!');
        setTimeout(() => setProfileSuccess(''), 4000);
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match. Please re-enter.');
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (res.success) {
        setPasswordSuccess('Password successfully updated!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setPasswordSuccess(''), 5000);
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password. Please verify current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setPrefSuccess('Attendance preferences successfully saved!');
    setTimeout(() => setPrefSuccess(''), 3000);
  };

  const staffName = user?.employee 
    ? `${user.employee.firstName} ${user.employee.lastName}` 
    : user?.username || 'Staff Member';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Account & Profile Settings
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal workforce profile, picture, security credentials, and attendance preferences.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'profile'
              ? 'bg-[#39333B] text-white shadow-sm border border-[#534757]'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <User className={`w-3.5 h-3.5 ${activeTab === 'profile' ? 'text-[#DFC090]' : 'text-slate-400'}`} />
          <span>My Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'security'
              ? 'bg-[#39333B] text-white shadow-sm border border-[#534757]'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Lock className={`w-3.5 h-3.5 ${activeTab === 'security' ? 'text-[#DFC090]' : 'text-slate-400'}`} />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'preferences'
              ? 'bg-[#39333B] text-white shadow-sm border border-[#534757]'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bell className={`w-3.5 h-3.5 ${activeTab === 'preferences' ? 'text-[#DFC090]' : 'text-slate-400'}`} />
          <span>Preferences & Shifts</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: MY PROFILE & AVATAR                                 */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: User Summary Card (Collision-Free) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col items-center text-center">
            {/* Interactive Avatar with Click to Change */}
            <div 
              className="relative mb-4 group cursor-pointer" 
              onClick={() => fileInputRef.current?.click()} 
              title="Click to upload profile picture"
            >
              <UserAvatar 
                name={staffName} 
                avatar={profileForm.avatar || user?.avatar || user?.employee?.avatar}
                size="2xl" 
                className="w-24 h-24 text-2xl border-2 border-[#DFC090] shadow-md ring-4 ring-[#DFC090]/15"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 backdrop-blur-[2px]">
                <Camera className="w-5 h-5 text-[#DFC090]" />
                <span>Change Photo</span>
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" title="Active Workforce Account" />
            </div>

            <h3 className="text-base font-bold text-slate-900 tracking-tight">{staffName}</h3>
            <p className="text-xs text-[#8C6F4B] font-semibold mt-0.5">@{user?.username}</p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-[#39333B] text-[#F5E6CC] border border-[#DFC090]/40 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#DFC090]" />
              <span>{isAdmin ? 'System Administrator / Leader' : 'Staff Member'}</span>
            </div>

            {/* Structured Metadata Badges - Collision-Free Layout */}
            <div className="w-full mt-6 pt-5 border-t border-slate-100 space-y-2.5 text-left text-xs">
              {/* Department */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                <span className="text-slate-500 flex items-center gap-1.5 shrink-0 text-[11px] font-medium">
                  <Building2 className="w-3.5 h-3.5 text-[#8C6F4B]" /> Department
                </span>
                <span className="font-semibold text-slate-800 text-right truncate">
                  {user?.employee?.department?.name || 'Executive'}
                </span>
              </div>

              {/* Official Position */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                <span className="text-slate-500 flex items-center gap-1.5 text-[11px] font-medium">
                  <Briefcase className="w-3.5 h-3.5 text-[#8C6F4B]" /> Official Position
                </span>
                <span className="font-semibold text-slate-800 text-xs leading-snug break-words">
                  {user?.employee?.position || 'System Administrator & Project Director'}
                </span>
              </div>

              {/* Employee ID */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                <span className="text-slate-500 flex items-center gap-1.5 shrink-0 text-[11px] font-medium">
                  <FileText className="w-3.5 h-3.5 text-[#8C6F4B]" /> Employee ID
                </span>
                <span className="font-mono font-bold text-[#39333B] bg-white px-2 py-0.5 rounded-md border border-slate-200 text-xs">
                  {user?.employee?.employeeId || 'EMP-1001'}
                </span>
              </div>

              {/* Shift - Structured so it NEVER collides */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                <span className="text-slate-500 flex items-center gap-1.5 text-[11px] font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#8C6F4B]" /> Work Schedule & Shift
                </span>
                <span className="font-semibold text-slate-800 text-xs leading-snug break-words">
                  {user?.employee?.shift || 'Flexible (8:30 AM - 4:30 PM)'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Edit Profile Form & Picture Uploader */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Personal Information & Profile Picture
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload your portrait photo, institutional contact details, and professional biography.
              </p>
            </div>

            {/* Hidden Native File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />

            {/* Profile Picture Management Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-[#FAF8FA] border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <UserAvatar 
                  name={staffName} 
                  avatar={profileForm.avatar || user?.avatar || user?.employee?.avatar} 
                  size="xl" 
                  className="w-14 h-14 text-base border-2 border-[#DFC090] shadow-sm"
                />
                <div>
                  <p className="font-bold text-slate-900 text-xs">Profile Picture</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Upload a formal workplace portrait from your device (PNG, JPG, or WEBP).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-[#39333B] hover:bg-[#4E3953] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#DFC090]" />
                  <span>Upload Photo</span>
                </button>

                {profileForm.avatar && (
                  <button
                    type="button"
                    onClick={handleResetAvatar}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    title="Reset photo to monogram initials"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>
            </div>

            {profileSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39333B]/15 focus:border-[#39333B] transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39333B]/15 focus:border-[#39333B] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5 flex items-center justify-between">
                    <span>Workplace Email Address</span>
                    {!isAdmin && (
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                        Admin Managed
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      disabled={!isAdmin}
                      readOnly={!isAdmin}
                      value={profileForm.email}
                      onChange={(e) => isAdmin && setProfileForm({ ...profileForm, email: e.target.value })}
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-slate-900 transition ${
                        !isAdmin 
                          ? 'bg-slate-100/80 border-slate-200 text-slate-500 cursor-not-allowed select-none' 
                          : 'bg-slate-50 border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39333B]/15 focus:border-[#39333B]'
                      }`}
                      title={!isAdmin ? 'Workplace email can only be modified by the System Administrator.' : ''}
                    />
                  </div>
                  {!isAdmin && (
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      Institutional email is restricted. Contact your System Administrator to request an email update.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Contact Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39333B]/15 focus:border-[#39333B] transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Professional Bio & Institutional Notes</label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39333B]/15 focus:border-[#39333B] transition resize-none leading-relaxed"
                  placeholder="Tell us about your institutional responsibilities..."
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#39333B] hover:bg-[#4A3C4D] text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{profileLoading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SECURITY & PASSWORD                                */}
      {/* ======================================================== */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] max-w-2xl">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#8C6F4B] border border-amber-200/60 flex items-center justify-center shrink-0 shadow-sm">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Change Account Password</h3>
              <p className="text-xs text-slate-500">Ensure your account uses a secure password with at least 6 characters.</p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Current Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39333B]/15 focus:border-[#39333B] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">New Password (min 6 characters)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39333B]/15 focus:border-[#39333B] transition"
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
                <label className="block text-slate-700 font-semibold mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39333B]/15 focus:border-[#39333B] transition"
                  />
                </div>
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="font-semibold text-slate-700 flex items-center justify-between text-[11px]">
                <span>Password Minimum Requirements:</span>
                <span className={passwordForm.newPassword.length >= 6 ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                  {passwordForm.newPassword.length}/6 characters
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[11px]">
                <span className={`inline-flex items-center gap-1.5 ${passwordForm.newPassword.length >= 6 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${passwordForm.newPassword.length >= 6 ? 'text-emerald-600' : 'text-slate-300'}`} />
                  At least 6 characters (Required)
                </span>
                <span className={`inline-flex items-center gap-1.5 ${passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword ? 'text-emerald-600' : 'text-slate-300'}`} />
                  Passwords match exactly
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-5 py-2.5 rounded-xl bg-[#39333B] hover:bg-[#4A3C4D] text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{passwordLoading ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PREFERENCES & SHIFTS                              */}
      {/* ======================================================== */}
      {activeTab === 'preferences' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] max-w-2xl">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5">
            Attendance & Audit Preferences
          </h3>

          {prefSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{prefSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSavePreferences} className="space-y-5 text-xs">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <div>
                <p className="font-bold text-slate-900">Shift Check-In Reminders</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Receive prompt reminders 10 minutes before 9:00 AM grace period ends.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.punchReminders}
                onChange={(e) => setPreferences({ ...preferences, punchReminders: e.target.checked })}
                className="w-4 h-4 text-[#39333B] rounded border-slate-300 focus:ring-0 cursor-pointer accent-[#39333B]"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <div>
                <p className="font-bold text-slate-900">Leave Approval Notifications</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Receive status alerts when your formal leave request is reviewed by administrator.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailAlerts}
                onChange={(e) => setPreferences({ ...preferences, emailAlerts: e.target.checked })}
                className="w-4 h-4 text-[#39333B] rounded border-slate-300 focus:ring-0 cursor-pointer accent-[#39333B]"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <label className="block font-bold text-slate-900 mb-1">Time Display Format</label>
              <p className="text-[11px] text-slate-500 mb-3">Choose how clock-in timestamps are formatted across the portal.</p>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="timeFormat"
                    value="12h"
                    checked={preferences.timeFormat === '12h'}
                    onChange={() => setPreferences({ ...preferences, timeFormat: '12h' })}
                    className="text-[#39333B] accent-[#39333B]"
                  />
                  <span>12-Hour Standard (e.g. 09:00 AM)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="timeFormat"
                    value="24h"
                    checked={preferences.timeFormat === '24h'}
                    onChange={() => setPreferences({ ...preferences, timeFormat: '24h' })}
                    className="text-[#39333B] accent-[#39333B]"
                  />
                  <span>24-Hour Military (e.g. 09:00)</span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#39333B] hover:bg-[#4A3C4D] text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
