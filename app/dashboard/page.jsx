'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { DEVICE_STATUS, toPersianNum, formatDate } from '@/lib/constants';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    persons: 0,
    products: 0,
    devices: 0,
    repairs: 0,
    tests: 0,
  });
  const [recentDevices, setRecentDevices] = useState([]);
  const [recentRepairs, setRecentRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [persons, products, devices, repairs, tests] = await Promise.all([
        api.getPersons().catch(() => []),
        api.getProducts().catch(() => []),
        api.getDevices().catch(() => []),
        api.getRepairs().catch(() => []),
        api.getTests().catch(() => []),
      ]);

      setStats({
        persons: persons?.length || 0,
        products: products?.length || 0,
        devices: devices?.length || 0,
        repairs: repairs?.length || 0,
        tests: tests?.length || 0,
      });

      setRecentDevices((devices || []).slice(0, 5));
      setRecentRepairs((repairs || []).slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'پرسنل', 
      value: stats.persons, 
      href: '/persons',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
    },
    { 
      label: 'محصولات', 
      value: stats.products, 
      href: '/products',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-600',
    },
    { 
      label: 'دستگاه‌ها', 
      value: stats.devices, 
      href: '/devices',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-emerald-500 to-emerald-600',
    },
    { 
      label: 'تعمیرات', 
      value: stats.repairs, 
      href: '/repairs',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        </svg>
      ),
      color: 'from-amber-500 to-amber-600',
    },
    { 
      label: 'تست‌ها', 
      value: stats.tests, 
      href: '/tests',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      color: 'from-rose-500 to-rose-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">داشبورد</h1>
        <p className="text-dark-400 mt-1">خلاصه وضعیت سیستم</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.href} href={stat.href}>
            <div className="stat-card hover:border-dark-600 transition-all group cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                  {stat.icon}
                </div>
                <svg className="w-5 h-5 text-dark-500 group-hover:text-dark-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-white">{toPersianNum(stat.value)}</p>
              <p className="text-dark-400 text-sm mt-1">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Devices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">آخرین دستگاه‌ها</h2>
            <Link href="/devices" className="text-primary-400 hover:text-primary-300 text-sm">
              مشاهده همه
            </Link>
          </div>
          {recentDevices.length > 0 ? (
            <div className="space-y-3">
              {recentDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center text-dark-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{device.serial_number}</p>
                      <p className="text-dark-500 text-xs">{formatDate(device.assembly_date)}</p>
                    </div>
                  </div>
                  <span className={`badge badge-${DEVICE_STATUS[device.status]?.color || 'neutral'}`}>
                    {DEVICE_STATUS[device.status]?.label || device.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dark-500 text-center py-8">دستگاهی ثبت نشده</p>
          )}
        </div>

        {/* Recent Repairs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">آخرین تعمیرات</h2>
            <Link href="/repairs" className="text-primary-400 hover:text-primary-300 text-sm">
              مشاهده همه
            </Link>
          </div>
          {recentRepairs.length > 0 ? (
            <div className="space-y-3">
              {recentRepairs.map((repair) => (
                <div key={repair.id} className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center text-dark-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium line-clamp-1">{repair.reported_issue}</p>
                      <p className="text-dark-500 text-xs">{formatDate(repair.repair_date)}</p>
                    </div>
                  </div>
                  <span className={`badge ${repair.is_warranty_repair ? 'badge-success' : 'badge-warning'}`}>
                    {repair.is_warranty_repair ? 'گارانتی' : 'غیر گارانتی'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dark-500 text-center py-8">تعمیری ثبت نشده</p>
          )}
        </div>
      </div>
    </div>
  );
}
