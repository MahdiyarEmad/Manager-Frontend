'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';

export default function PersonsLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Sidebar />
      <main className="mr-64 min-h-screen p-6">
        {children}
      </main>
    </div>
  );
}
