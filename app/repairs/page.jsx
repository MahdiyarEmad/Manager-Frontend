'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import PersianDatePicker from '@/components/PersianDatePicker';

export default function RepairsPage() {
  const [repairs, setRepairs] = useState([]);
  const [devices, setDevices] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [warrantyFilter, setWarrantyFilter] = useState('');
  const [formData, setFormData] = useState({
    device_id: '',
    reported_issue: '',
    repair_actions: '',
    repaired_by: '',
    repair_date: '',
    is_warranty_repair: false,
    cost: '',
    note: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [repairsData, devicesData, personsData] = await Promise.all([
        api.getRepairs(),
        api.getDevices(),
        api.getPersons(),
      ]);
      setRepairs(repairsData || []);
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
        repaired_by: formData.repaired_by ? parseInt(formData.repaired_by) : null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
      };

      if (editingRepair) {
        await api.updateRepair(editingRepair.id, submitData);
        setToast({ message: 'تعمیر با موفقیت ویرایش شد', type: 'success' });
      } else {
        await api.createRepair(submitData);
        setToast({ message: 'تعمیر جدید با موفقیت ثبت شد', type: 'success' });
      }
      setModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleEdit = (repair) => {
    setEditingRepair(repair);
    setFormData({
      device_id: repair.device_id || '',
      reported_issue: repair.reported_issue || '',
      repair_actions: repair.repair_actions || '',
      repaired_by: repair.repaired_by || '',
      repair_date: repair.repair_date || '',
      is_warranty_repair: repair.is_warranty_repair || false,
      cost: repair.cost || '',
      note: repair.note || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteRepair(id);
      setToast({ message: 'تعمیر با موفقیت حذف شد', type: 'success' });
      loadData();
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const resetForm = () => {
    setEditingRepair(null);
    setFormData({
      device_id: '',
      reported_issue: '',
      repair_actions: '',
      repaired_by: '',
      repair_date: '',
      is_warranty_repair: false,
      cost: '',
      note: '',
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
    { 
      key: 'reported_issue', 
      label: 'مشکل',
      render: (value) => (
        <span className="line-clamp-1" title={value}>{value}</span>
      )
    },
    { 
      key: 'repair_date', 
      label: 'تاریخ تعمیر',
      render: (value) => formatDate(value)
    },
    { 
      key: 'is_warranty_repair', 
      label: 'گارانتی',
      render: (value) => (
        <span className={`badge ${value ? 'badge-success' : 'badge-warning'}`}>
          {value ? '✓ گارانتی' : 'غیر گارانتی'}
        </span>
      )
    },
    { 
      key: 'cost', 
      label: 'هزینه',
      render: (value) => value ? formatPrice(value) : '-'
    },
  ];

  const filteredRepairs = repairs.filter(repair => {
    const matchesSearch = repair.reported_issue?.toLowerCase().includes(search.toLowerCase()) ||
      getDeviceSerial(repair.device_id).toLowerCase().includes(search.toLowerCase());
    const matchesWarranty = warrantyFilter === '' || 
      (warrantyFilter === 'warranty' && repair.is_warranty_repair) ||
      (warrantyFilter === 'non-warranty' && !repair.is_warranty_repair);
    return matchesSearch && matchesWarranty;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">مدیریت تعمیرات</h1>
          <p className="text-dark-400 mt-1">لیست تعمیرات انجام شده</p>
        </div>
        <button onClick={() => { resetForm(); setModalOpen(true); }} className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          ثبت تعمیر
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
              placeholder="جستجو بر اساس سریال یا مشکل..."
              className="form-input pr-10"
            />
          </div>
          <select
            value={warrantyFilter}
            onChange={(e) => setWarrantyFilter(e.target.value)}
            className="form-input w-full md:w-48"
          >
            <option value="">همه تعمیرات</option>
            <option value="warranty">تعمیرات گارانتی</option>
            <option value="non-warranty">تعمیرات غیر گارانتی</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredRepairs}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="تعمیری ثبت نشده است"
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRepair ? 'ویرایش تعمیر' : 'ثبت تعمیر جدید'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-sm text-dark-300 mb-2">تعمیرکار</label>
              <select
                value={formData.repaired_by}
                onChange={(e) => setFormData({ ...formData, repaired_by: e.target.value })}
                className="form-input"
              >
                <option value="">انتخاب کنید</option>
                {persons.map(person => (
                  <option key={person.id} value={person.id}>{person.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <PersianDatePicker
                label="تاریخ تعمیر"
                value={formData.repair_date}
                onChange={(date) => setFormData({ ...formData, repair_date: date })}
              />
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">هزینه (تومان)</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="form-input"
                dir="ltr"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">مشکل گزارش شده *</label>
            <textarea
              value={formData.reported_issue}
              onChange={(e) => setFormData({ ...formData, reported_issue: e.target.value })}
              className="form-input"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">اقدامات انجام شده</label>
            <textarea
              value={formData.repair_actions}
              onChange={(e) => setFormData({ ...formData, repair_actions: e.target.value })}
              className="form-input"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-dark-900 rounded-lg">
            <input
              type="checkbox"
              id="is_warranty"
              checked={formData.is_warranty_repair}
              onChange={(e) => setFormData({ ...formData, is_warranty_repair: e.target.checked })}
              className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="is_warranty" className="text-white cursor-pointer">
              تعمیر گارانتی
            </label>
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">یادداشت</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="form-input"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn btn-primary flex-1">
              {editingRepair ? 'ذخیره تغییرات' : 'ثبت تعمیر'}
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
