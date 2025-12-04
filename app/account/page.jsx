'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ACCOUNT_ROLES, formatDateTime } from '@/lib/constants';
import Toast from '@/components/Toast';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    loadUser();
    setBaseUrl(localStorage.getItem('marv_base_url') || 'http://localhost:8000/api');
  }, []);

  const loadUser = async () => {
    try {
      const userData = await api.me();
      setUser(userData);
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    router.push('/login');
  };

  const handleClearSessions = async () => {
    try {
      await api.clearSessions();
      setToast({ message: 'تمام نشست‌ها پاک شد', type: 'success' });
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleSaveSettings = () => {
    api.setBaseUrl(baseUrl);
    setToast({ message: 'تنظیمات ذخیره شد', type: 'success' });
    setSettingsOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">حساب کاربری</h1>
        <p className="text-dark-400 mt-1">مدیریت حساب و تنظیمات</p>
      </div>

      {/* User Info Card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {user?.username?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.username}</h2>
            <span className={`badge badge-info mt-1`}>
              {ACCOUNT_ROLES[user?.role] || user?.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-dark-900 rounded-xl">
            <p className="text-dark-400 text-sm">نام کاربری</p>
            <p className="text-white font-medium mt-1">{user?.username}</p>
          </div>
          <div className="p-4 bg-dark-900 rounded-xl">
            <p className="text-dark-400 text-sm">نقش</p>
            <p className="text-white font-medium mt-1">{ACCOUNT_ROLES[user?.role] || user?.role}</p>
          </div>
          <div className="p-4 bg-dark-900 rounded-xl md:col-span-2">
            <p className="text-dark-400 text-sm">تاریخ ثبت‌نام</p>
            <p className="text-white font-medium mt-1">{formatDateTime(user?.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card space-y-3">
        <h3 className="text-lg font-bold text-white mb-4">عملیات</h3>
        
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="w-full flex items-center justify-between p-4 bg-dark-900 rounded-xl hover:bg-dark-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-dark-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">تنظیمات سرور</p>
              <p className="text-dark-500 text-sm">تغییر آدرس API</p>
            </div>
          </div>
          <svg className={`w-5 h-5 text-dark-400 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {settingsOpen && (
          <div className="p-4 bg-dark-900/50 rounded-xl space-y-4 animate-fade-in">
            <div>
              <label className="block text-sm text-dark-300 mb-2">آدرس سرور API</label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="form-input"
                dir="ltr"
                placeholder="http://localhost:8000/api"
              />
            </div>
            <button onClick={handleSaveSettings} className="btn btn-primary">
              ذخیره تنظیمات
            </button>
          </div>
        )}

        <button
          onClick={handleClearSessions}
          className="w-full flex items-center gap-3 p-4 bg-dark-900 rounded-xl hover:bg-dark-800 transition-colors"
        >
          <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="text-right">
            <p className="text-white font-medium">پاک کردن نشست‌ها</p>
            <p className="text-dark-500 text-sm">خروج از همه دستگاه‌ها</p>
          </div>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20"
        >
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <div className="text-right">
            <p className="text-red-400 font-medium">خروج از حساب</p>
            <p className="text-dark-500 text-sm">خروج از این دستگاه</p>
          </div>
        </button>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
