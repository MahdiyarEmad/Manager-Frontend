'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Toast from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // login or register
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    baseUrl: 'http://localhost:8000/api',
  });

  useEffect(() => {
    // Check if already logged in
    const token = api.getToken();
    if (token) {
      router.push('/dashboard');
    }
    // Load saved base URL
    const savedUrl = localStorage.getItem('marv_base_url');
    if (savedUrl) {
      setFormData(prev => ({ ...prev, baseUrl: savedUrl }));
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save base URL
      api.setBaseUrl(formData.baseUrl);

      if (mode === 'login') {
        await api.login(formData.username, formData.password);
        router.push('/dashboard');
      } else {
        await api.register(formData.username, formData.password);
        setToast({ message: 'ثبت‌نام با موفقیت انجام شد', type: 'success' });
        setMode('login');
      }
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg shadow-primary-500/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">مارو منیجر</h1>
          <p className="text-dark-400 mt-1">سیستم مدیریت گارانتی و تعمیرات</p>
        </div>

        {/* Form Card */}
        <div className="bg-dark-800/80 backdrop-blur-xl border border-dark-700 rounded-2xl p-6 shadow-2xl">
          {/* Tabs */}
          <div className="flex mb-6 bg-dark-900 rounded-xl p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'login' 
                  ? 'bg-primary-600 text-white shadow-lg' 
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              ورود
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'register' 
                  ? 'bg-primary-600 text-white shadow-lg' 
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              ثبت‌نام
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Server URL - Collapsible */}
            <details className="group">
              <summary className="flex items-center gap-2 text-sm text-dark-400 cursor-pointer hover:text-dark-300 mb-2">
                <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                تنظیمات سرور
              </summary>
              <input
                type="url"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                className="form-input text-sm"
                placeholder="http://localhost:8000/api"
                dir="ltr"
              />
            </details>

            <div>
              <label className="block text-sm text-dark-300 mb-2">نام کاربری</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="form-input"
                placeholder="نام کاربری خود را وارد کنید"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">رمز عبور</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="form-input"
                placeholder="رمز عبور خود را وارد کنید"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>لطفا صبر کنید...</span>
                </>
              ) : (
                mode === 'login' ? 'ورود به سیستم' : 'ثبت‌نام'
              )}
            </button>
          </form>
        </div>

        {/* Public Warranty Check Link */}
        <div className="mt-6 text-center">
          <a 
            href="/warranty" 
            className="text-primary-400 hover:text-primary-300 text-sm inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            استعلام گارانتی (بدون نیاز به ورود)
          </a>
        </div>
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
