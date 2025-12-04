'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { TEST_RESULTS, formatDate } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';

export default function TestsPage() {
  const [tests, setTests] = useState([]);
  const [devices, setDevices] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [formData, setFormData] = useState({
    device_id: '',
    tester_id: '',
    test_name: '',
    test_date: '',
    test_result: 'passed',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [testsData, devicesData, personsData] = await Promise.all([
        api.getTests(),
        api.getDevices(),
        api.getPersons(),
      ]);
      setTests(testsData || []);
      setDevices(devicesData || []);
      setPersons(personsData || []);
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        device_id: formData.device_id ? parseInt(formData.device_id) : null,
        tester_id: formData.tester_id ? parseInt(formData.tester_id) : null,
      };

      if (editingTest) {
        await api.updateTest(editingTest.id, submitData);
        setToast({ message: 'تست با موفقیت ویرایش شد', type: 'success' });
      } else {
        await api.createTest(submitData);
        setToast({ message: 'تست جدید با موفقیت ثبت شد', type: 'success' });
      }
      setModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleEdit = (test) => {
    setEditingTest(test);
    setFormData({
      device_id: test.device_id || '',
      tester_id: test.tester_id || '',
      test_name: test.test_name || '',
      test_date: test.test_date || '',
      test_result: test.test_result || 'passed',
      notes: test.notes || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteTest(id);
      setToast({ message: 'تست با موفقیت حذف شد', type: 'success' });
      loadData();
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const resetForm = () => {
    setEditingTest(null);
    setFormData({
      device_id: '',
      tester_id: '',
      test_name: '',
      test_date: '',
      test_result: 'passed',
      notes: '',
    });
  };

  const getDeviceSerial = (id) => {
    const device = devices.find(d => d.id === id);
    return device?.serial_number || '-';
  };

  const getPersonName = (id) => {
    const person = persons.find(p => p.id === id);
    return person?.full_name || '-';
  };

  const columns = [
    { key: 'id', label: 'شناسه', width: '70px' },
    { 
      key: 'device_id', 
      label: 'سریال دستگاه',
      render: (value) => getDeviceSerial(value)
    },
    { key: 'test_name', label: 'نام تست' },
    { 
      key: 'tester_id', 
      label: 'تستر',
      render: (value) => getPersonName(value)
    },
    { 
      key: 'test_date', 
      label: 'تاریخ',
      render: (value) => formatDate(value)
    },
    { 
      key: 'test_result', 
      label: 'نتیجه',
      render: (value) => {
        const result = TEST_RESULTS[value];
        return (
          <span className={`badge badge-${result?.color || 'neutral'}`}>
            {result?.icon} {result?.label || value}
          </span>
        );
      }
    },
  ];

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.test_name?.toLowerCase().includes(search.toLowerCase()) ||
      getDeviceSerial(test.device_id).toLowerCase().includes(search.toLowerCase());
    const matchesResult = !resultFilter || test.test_result === resultFilter;
    return matchesSearch && matchesResult;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">مدیریت تست‌ها</h1>
          <p className="text-dark-400 mt-1">لیست تست‌های انجام شده</p>
        </div>
        <button onClick={() => { resetForm(); setModalOpen(true); }} className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          ثبت تست
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو بر اساس سریال یا نام تست..."
              className="form-input pr-10"
            />
          </div>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="form-input w-full md:w-48"
          >
            <option value="">همه نتایج</option>
            {Object.entries(TEST_RESULTS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredTests}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="تستی ثبت نشده است"
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTest ? 'ویرایش تست' : 'ثبت تست جدید'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-300 mb-2">دستگاه *</label>
            <select
              value={formData.device_id}
              onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
              className="form-input"
              required
            >
              <option value="">انتخاب کنید</option>
              {devices.map(device => (
                <option key={device.id} value={device.id}>{device.serial_number}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">نام تست *</label>
            <input
              type="text"
              value={formData.test_name}
              onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">تستر</label>
            <select
              value={formData.tester_id}
              onChange={(e) => setFormData({ ...formData, tester_id: e.target.value })}
              className="form-input"
            >
              <option value="">انتخاب کنید</option>
              {persons.map(person => (
                <option key={person.id} value={person.id}>{person.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">تاریخ تست</label>
            <input
              type="date"
              value={formData.test_date}
              onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
              className="form-input"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">نتیجه</label>
            <select
              value={formData.test_result}
              onChange={(e) => setFormData({ ...formData, test_result: e.target.value })}
              className="form-input"
            >
              {Object.entries(TEST_RESULTS).map(([key, { label, icon }]) => (
                <option key={key} value={key}>{icon} {label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">یادداشت</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-input"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn btn-primary flex-1">
              {editingTest ? 'ذخیره تغییرات' : 'ثبت تست'}
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn btn-secondary"
            >
              انصراف
            </button>
          </div>
        </form>
      </Modal>

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
