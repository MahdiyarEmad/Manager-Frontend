'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { JOB_ROLES, formatDate } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';

export default function PersonsPage() {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    job_role: 'assembler',
    phone: '',
    hire_date: '',
    note: '',
  });

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      const data = await api.getPersons();
      setPersons(data || []);
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPerson) {
        await api.updatePerson(editingPerson.id, formData);
        setToast({ message: 'پرسنل با موفقیت ویرایش شد', type: 'success' });
      } else {
        await api.createPerson(formData);
        setToast({ message: 'پرسنل جدید با موفقیت ایجاد شد', type: 'success' });
      }
      setModalOpen(false);
      resetForm();
      loadPersons();
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleEdit = (person) => {
    setEditingPerson(person);
    setFormData({
      full_name: person.full_name || '',
      job_role: person.job_role || 'assembler',
      phone: person.phone || '',
      hire_date: person.hire_date || '',
      note: person.note || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deletePerson(id);
      setToast({ message: 'پرسنل با موفقیت حذف شد', type: 'success' });
      loadPersons();
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const resetForm = () => {
    setEditingPerson(null);
    setFormData({
      full_name: '',
      job_role: 'assembler',
      phone: '',
      hire_date: '',
      note: '',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const columns = [
    { key: 'id', label: 'شناسه', width: '80px' },
    { key: 'full_name', label: 'نام و نام خانوادگی' },
    { 
      key: 'job_role', 
      label: 'سمت',
      render: (value) => (
        <span className="badge badge-info">{JOB_ROLES[value] || value}</span>
      )
    },
    { key: 'phone', label: 'تلفن' },
    { 
      key: 'hire_date', 
      label: 'تاریخ استخدام',
      render: (value) => formatDate(value)
    },
  ];

  const filteredPersons = persons.filter(person => 
    person.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    person.phone?.includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">مدیریت پرسنل</h1>
          <p className="text-dark-400 mt-1">لیست پرسنل و کارکنان</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          افزودن پرسنل
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس نام یا تلفن..."
            className="form-input pr-10"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredPersons}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="پرسنلی ثبت نشده است"
      />

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPerson ? 'ویرایش پرسنل' : 'افزودن پرسنل جدید'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-300 mb-2">نام و نام خانوادگی *</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="form-input"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">سمت</label>
            <select
              value={formData.job_role}
              onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
              className="form-input"
            >
              {Object.entries(JOB_ROLES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">تلفن</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="form-input"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">تاریخ استخدام</label>
            <input
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              className="form-input"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">یادداشت</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="form-input"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn btn-primary flex-1">
              {editingPerson ? 'ذخیره تغییرات' : 'ایجاد پرسنل'}
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
