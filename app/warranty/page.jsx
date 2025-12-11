'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { DEVICE_STATUS, formatDate, toPersianNum } from '@/lib/constants';
import Toast from '@/components/Toast';

export default function WarrantyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read serial from URL (?d=xxxx)
  const [serial, setSerial] = useState(searchParams.get("d") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [toast, setToast] = useState(null);

  const updateQueryParam = (value) => {
    const params = new URLSearchParams(window.location.search);

    if (value.trim()) params.set("d", value.trim());
    else params.delete("d");

    router.replace(`?${params.toString()}`);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!serial.trim()) return;

    setLoading(true);
    setResult(null);
    setRepairs([]);

    try {
      const device = await api.getDeviceBySerial(serial.trim());
      setResult(device);

      // Repairs fetch (optional)
      try {
        const repairsData = await api.getRepairs({ device_id: device.id });
        setRepairs(repairsData || []);
      } catch {}
    } catch (error) {
      setToast({ message: 'دستگاهی با این سریال یافت نشد', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if URL contains ?d=xxxx
  useEffect(() => {
    const urlSerial = searchParams.get("d");
    if (urlSerial && !result && !loading) {
      setSerial(urlSerial);
      handleSearch({ preventDefault: () => {} });
    }
  }, []);

  const getWarrantyStatus = () => {
    if (!result?.warranty_end)
      return { status: 'unknown', label: 'نامشخص', color: 'neutral' };

    const endDate = new Date(result.warranty_end);
    const today = new Date();

    if (endDate > today) {
      const daysRemaining = Math.ceil((endDate - today) / 86400000);

      return {
        status: 'active',
        label: `گارانتی فعال - ${toPersianNum(daysRemaining)} روز باقی‌مانده`,
        color: 'success',
        days: daysRemaining,
      };
    }

    return {
      status: 'expired',
      label: 'گارانتی منقضی شده',
      color: 'danger',
    };
  };

  const warranty = result ? getWarrantyStatus() : null;

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg shadow-primary-500/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">استعلام گارانتی</h1>
          <p className="text-dark-400 mt-2">سریال دستگاه خود را وارد کنید</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={serial}
              onChange={(e) => {
                const value = e.target.value;
                setSerial(value);
                updateQueryParam(value);
              }}
              placeholder="سریال دستگاه"
              className="form-input flex-1 text-lg py-4"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !serial.trim()}
              className="btn btn-primary px-8 py-4"
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
          </div>
        </form>

        {/* Result */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Warranty Status */}
            <div className={`p-6 rounded-2xl border-2 ${
              warranty.color === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : warranty.color === 'danger'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-dark-800 border-dark-700'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  warranty.color === 'success'
                    ? 'bg-emerald-500/20'
                    : warranty.color === 'danger'
                    ? 'bg-red-500/20'
                    : 'bg-dark-700'
                }`}>
                  {warranty.status === 'active' ? (
                    <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ) : warranty.status === 'expired' ? (
                    <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`text-xl font-bold ${
                    warranty.color === 'success'
                      ? 'text-emerald-400'
                      : warranty.color === 'danger'
                      ? 'text-red-400'
                      : 'text-dark-300'
                  }`}>
                    {warranty.label}
                  </p>
                  <p className="text-dark-400 text-sm mt-1">سریال: {result.serial_number}</p>
                </div>
              </div>
            </div>

            {/* Device Info */}
            <div className="bg-dark-800/80 backdrop-blur border border-dark-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                اطلاعات دستگاه
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-dark-900 rounded-lg">
                  <p className="text-dark-400 text-sm">سریال</p>
                  <p className="text-white font-medium">{result.serial_number}</p>
                </div>
                <div className="p-3 bg-dark-900 rounded-lg">
                  <p className="text-dark-400 text-sm">وضعیت</p>
                  <span className={`badge badge-${DEVICE_STATUS[result.status]?.color || 'neutral'}`}>
                    {DEVICE_STATUS[result.status]?.label || result.status}
                  </span>
                </div>
                <div className="p-3 bg-dark-900 rounded-lg">
                  <p className="text-dark-400 text-sm">شروع گارانتی</p>
                  <p className="text-white font-medium">{formatDate(result.warranty_start)}</p>
                </div>
                <div className="p-3 bg-dark-900 rounded-lg">
                  <p className="text-dark-400 text-sm">پایان گارانتی</p>
                  <p className="text-white font-medium">{formatDate(result.warranty_end)}</p>
                </div>
              </div>
            </div>

            {/* Repairs */}
            {repairs.length > 0 && (
              <div className="bg-dark-800/80 backdrop-blur border border-dark-700 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0" />
                  </svg>
                  سابقه تعمیرات
                </h3>

                <div className="space-y-3">
                  {repairs.map((repair) => (
                    <div key={repair.id} className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
                      <div>
                        <p className="text-white text-sm">{repair.reported_issue}</p>
                        <p className="text-dark-500 text-xs mt-1">
                          {formatDate(repair.repair_date)}
                        </p>
                      </div>
                      <span
                        className={`badge ${
                          repair.is_warranty_repair ? 'badge-success' : 'badge-warning'
                        }`}
                      >
                        {repair.is_warranty_repair ? 'گارانتی' : 'غیر گارانتی'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Back to Login */}
        <div className="text-center mt-10">
          <a
            href="/login"
            className="text-primary-400 hover:text-primary-300 text-sm inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            ورود به پنل مدیریت
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
