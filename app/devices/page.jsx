'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { DEVICE_STATUS, formatDate } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [products, setProducts] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [viewingDevice, setViewingDevice] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState({
    serial_number: '',
    product_id: '',
    assembled_by: '',
    tested_by: '',
    assembly_date: '',
    test_date: '',
    warranty_start: '',
    warranty_end: '',
    status: 'active',
    note: '',
  });

  const [bulkData, setBulkData] = useState({
    prefix: '',
    start_serial: '',
    end_serial: '',
    product_id: '',
    assembled_by: '',
    tested_by: '',
    assembly_date: '',
    test_date: '',
    warranty_start: '',
    warranty_end: '',
    status: 'active',
    note: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [devicesData, productsData, personsData] = await Promise.all([
        api.getDevices(),
        api.getProducts(),
        api.getPersons(),
      ]);
      setDevices(devicesData || []);
      setProducts(productsData || []);
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
        product_id: formData.product_id ? parseInt(formData.product_id) : null,
        assembled_by: formData.assembled_by ? parseInt(formData.assembled_by) : null,
        tested_by: formData.tested_by ? parseInt(formData.tested_by) : null,
      };

      if (editingDevice) {
        await api.updateDevice(editingDevice.id, submitData);
        setToast({ message: 'دستگاه با موفقیت ویرایش شد', type: 'success' });
      } else {
        await api.createDevice(submitData);
        setToast({ message: 'دستگاه جدید با موفقیت ایجاد شد', type: 'success' });
      }
      setModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleEdit = (device) => {
    setEditingDevice(device);
    setFormData({
      serial_number: device.serial_number || '',
      product_id: device.product_id || '',
      assembled_by: device.assembled_by || '',
      tested_by: device.tested_by || '',
      assembly_date: device.assembly_date || '',
      test_date: device.test_date || '',
      warranty_start: device.warranty_start || '',
      warranty_end: device.warranty_end || '',
      status: device.status || 'active',
      note: device.note || '',
    });
    setModalOpen(true);
  };

  const handleView = (device) => {
    setViewingDevice(device);
    setViewModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteDevice(id);
      setToast({ message: 'دستگاه با موفقیت حذف شد', type: 'success' });
      loadData();
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const resetBulkForm = () => {
    setBulkData({
      prefix: '',
      start_serial: '',
      end_serial: '',
      product_id: '',
      assembled_by: '',
      tested_by: '',
      assembly_date: '',
      test_date: '',
      warranty_start: '',
      warranty_end: '',
      status: 'active',
      note: '',
    });
    setBulkModalOpen(false);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const { prefix, start_serial, end_serial } = bulkData;

    const devicesToCreate = [];

    if (prefix && prefix.length > 0) {
      // If explicit prefix provided, expect numeric start/end
      if (!/^[0-9]+$/.test(start_serial) || !/^[0-9]+$/.test(end_serial)) {
        setToast({ message: 'وقتی پیشوند وارد شده است، لطفاً فقط شماره‌های آغاز/پایان وارد کنید', type: 'error' });
        return;
      }

      const startNum = parseInt(start_serial, 10);
      const endNum = parseInt(end_serial, 10);
      if (isNaN(startNum) || isNaN(endNum) || endNum < startNum) {
        setToast({ message: 'بازه سریال نامعتبر است', type: 'error' });
        return;
      }

      const padLength = Math.max(start_serial.length, end_serial.length);
      for (let n = startNum; n <= endNum; n++) {
        const serial = `${prefix}${String(n).padStart(padLength, '0')}`;
        devicesToCreate.push({
          serial_number: serial,
          product_id: bulkData.product_id ? parseInt(bulkData.product_id) : null,
          assembled_by: bulkData.assembled_by ? parseInt(bulkData.assembled_by) : null,
          tested_by: bulkData.tested_by ? parseInt(bulkData.tested_by) : null,
          assembly_date: bulkData.assembly_date || null,
          test_date: bulkData.test_date || null,
          warranty_start: bulkData.warranty_start || null,
          warranty_end: bulkData.warranty_end || null,
          status: bulkData.status || 'active',
          note: bulkData.note || '',
        });
      }
    } else {
      // Fallback to previous behavior which parses prefix from the inputs
      const startMatch = String(start_serial || '').match(/^(.*?)(\d+)$/);
      const endMatch = String(end_serial || '').match(/^(.*?)(\d+)$/);
      if (!startMatch || !endMatch) {
        setToast({ message: 'فرمت سریال نامعتبر است؛ از الگوی prefix+number استفاده کنید', type: 'error' });
        return;
      }

      const startPrefix = startMatch[1];
      const endPrefix = endMatch[1];
      if (startPrefix !== endPrefix) {
        setToast({ message: 'پیشوند سریال‌ها باید یکسان باشند', type: 'error' });
        return;
      }

      const startNum = parseInt(startMatch[2], 10);
      const endNum = parseInt(endMatch[2], 10);
      if (isNaN(startNum) || isNaN(endNum) || endNum < startNum) {
        setToast({ message: 'بازه سریال نامعتبر است', type: 'error' });
        return;
      }

      const padLength = Math.max(startMatch[2].length, endMatch[2].length);
      const prefixFromInput = startPrefix || '';
      for (let n = startNum; n <= endNum; n++) {
        const serial = `${prefixFromInput}${String(n).padStart(padLength, '0')}`;
        devicesToCreate.push({
          serial_number: serial,
          product_id: bulkData.product_id ? parseInt(bulkData.product_id) : null,
          assembled_by: bulkData.assembled_by ? parseInt(bulkData.assembled_by) : null,
          tested_by: bulkData.tested_by ? parseInt(bulkData.tested_by) : null,
          assembly_date: bulkData.assembly_date || null,
          test_date: bulkData.test_date || null,
          warranty_start: bulkData.warranty_start || null,
          warranty_end: bulkData.warranty_end || null,
          status: bulkData.status || 'active',
          note: bulkData.note || '',
        });
      }
    }

    try {
      await api.createDevicesBulk(devicesToCreate);
      setToast({ message: 'دستگاه‌ها با موفقیت ایجاد شدند', type: 'success' });
      resetBulkForm();
      loadData();
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const resetForm = () => {
    setEditingDevice(null);
    setFormData({
      serial_number: '',
      product_id: '',
      assembled_by: '',
      tested_by: '',
      assembly_date: '',
      test_date: '',
      warranty_start: '',
      warranty_end: '',
      status: 'active',
      note: '',
    });
  };

  const getProductName = (id) => {
    const product = products.find(p => p.id === id);
    return product ? `${product.name} ${product.model || ''}` : '-';
  };

  const getPersonName = (id) => {
    const person = persons.find(p => p.id === id);
    return person?.full_name || '-';
  };

  const columns = [
    { key: 'id', label: 'شناسه', width: '70px' },
    { key: 'serial_number', label: 'سریال' },
    { 
      key: 'product_id', 
      label: 'محصول',
      render: (value) => getProductName(value)
    },
    { 
      key: 'status', 
      label: 'وضعیت',
      render: (value) => {
        const status = DEVICE_STATUS[value];
        return (
          <span className={`badge badge-${status?.color || 'neutral'}`}>
            {status?.icon} {status?.label || value}
          </span>
        );
      }
    },
    { 
      key: 'warranty_end', 
      label: 'پایان گارانتی',
      render: (value) => {
        if (!value) return '-';
        const endDate = new Date(value);
        const today = new Date();
        const isExpired = endDate < today;
        return (
          <span className={isExpired ? 'text-red-400' : 'text-emerald-400'}>
            {formatDate(value)}
          </span>
        );
      }
    },
  ];

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.serial_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || device.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">مدیریت دستگاه‌ها</h1>
          <p className="text-dark-400 mt-1">لیست دستگاه‌های تولید شده</p>
        </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { resetForm(); setModalOpen(true); }} className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          افزودن دستگاه
        </button>
            <button onClick={() => { setBulkModalOpen(true); }} className="btn btn-secondary">
              ایجاد دسته‌ای
            </button>
          </div>
        </div>

      {/* Filters */}
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
              placeholder="جستجو بر اساس سریال..."
              className="form-input pr-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input w-full md:w-48"
          >
            <option value="">همه وضعیت‌ها</option>
            {Object.entries(DEVICE_STATUS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredDevices}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="دستگاهی ثبت نشده است"
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDevice ? 'ویرایش دستگاه' : 'افزودن دستگاه جدید'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-300 mb-2">سریال *</label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="form-input"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">محصول</label>
              <select
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="form-input"
              >
                <option value="">انتخاب کنید</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">مونتاژ توسط</label>
              <select
                value={formData.assembled_by}
                onChange={(e) => setFormData({ ...formData, assembled_by: e.target.value })}
                className="form-input"
              >
                <option value="">انتخاب کنید</option>
                {persons.map(person => (
                  <option key={person.id} value={person.id}>{person.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">تست توسط</label>
              <select
                value={formData.tested_by}
                onChange={(e) => setFormData({ ...formData, tested_by: e.target.value })}
                className="form-input"
              >
                <option value="">انتخاب کنید</option>
                {persons.map(person => (
                  <option key={person.id} value={person.id}>{person.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">تاریخ مونتاژ</label>
              <input
                type="date"
                value={formData.assembly_date}
                onChange={(e) => setFormData({ ...formData, assembly_date: e.target.value })}
                className="form-input"
                dir="ltr"
              />
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
              <label className="block text-sm text-dark-300 mb-2">شروع گارانتی</label>
              <input
                type="date"
                value={formData.warranty_start}
                onChange={(e) => setFormData({ ...formData, warranty_start: e.target.value })}
                className="form-input"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">پایان گارانتی</label>
              <input
                type="date"
                value={formData.warranty_end}
                onChange={(e) => setFormData({ ...formData, warranty_end: e.target.value })}
                className="form-input"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">وضعیت</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-input"
              >
                {Object.entries(DEVICE_STATUS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
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
              {editingDevice ? 'ذخیره تغییرات' : 'ایجاد دستگاه'}
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

      {/* Bulk Create Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="ایجاد دسته‌ای دستگاه"
        size="lg"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-300 mb-2">پیشوند (اختیاری)</label>
              <input
                type="text"
                value={bulkData.prefix}
                onChange={(e) => setBulkData({ ...bulkData, prefix: e.target.value })}
                className="form-input"
                placeholder="مثال: ABC- یا ABC"
              />
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">سریال شروع *</label>
              <input
                type="text"
                value={bulkData.start_serial}
                onChange={(e) => setBulkData({ ...bulkData, start_serial: e.target.value })}
                className="form-input"
                required
                autoFocus
                dir="ltr"
                placeholder={bulkData.prefix ? 'مثال: 0001' : 'مثال: ABC0001 یا 0001'}
              />
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">سریال پایان *</label>
              <input
                type="text"
                value={bulkData.end_serial}
                onChange={(e) => setBulkData({ ...bulkData, end_serial: e.target.value })}
                className="form-input"
                required
                dir="ltr"
                placeholder={bulkData.prefix ? 'مثال: 0010' : 'مثال: ABC0010 یا 0010'}
              />
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">محصول</label>
              <select
                value={bulkData.product_id}
                onChange={(e) => setBulkData({ ...bulkData, product_id: e.target.value })}
                className="form-input"
              >
                <option value="">انتخاب کنید</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">مونتاژ توسط</label>
              <select
                value={bulkData.assembled_by}
                onChange={(e) => setBulkData({ ...bulkData, assembled_by: e.target.value })}
                className="form-input"
              >
                <option value="">انتخاب کنید</option>
                {persons.map(person => (
                  <option key={person.id} value={person.id}>{person.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">تست توسط</label>
              <select
                value={bulkData.tested_by}
                onChange={(e) => setBulkData({ ...bulkData, tested_by: e.target.value })}
                className="form-input"
              >
                <option value="">انتخاب کنید</option>
                {persons.map(person => (
                  <option key={person.id} value={person.id}>{person.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">تاریخ مونتاژ</label>
              <input
                type="date"
                value={bulkData.assembly_date}
                onChange={(e) => setBulkData({ ...bulkData, assembly_date: e.target.value })}
                className="form-input"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">تاریخ تست</label>
              <input
                type="date"
                value={bulkData.test_date}
                onChange={(e) => setBulkData({ ...bulkData, test_date: e.target.value })}
                className="form-input"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">شروع گارانتی</label>
              <input
                type="date"
                value={bulkData.warranty_start}
                onChange={(e) => setBulkData({ ...bulkData, warranty_start: e.target.value })}
                className="form-input"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">پایان گارانتی</label>
              <input
                type="date"
                value={bulkData.warranty_end}
                onChange={(e) => setBulkData({ ...bulkData, warranty_end: e.target.value })}
                className="form-input"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2">وضعیت</label>
              <select
                value={bulkData.status}
                onChange={(e) => setBulkData({ ...bulkData, status: e.target.value })}
                className="form-input"
              >
                {Object.entries(DEVICE_STATUS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">یادداشت</label>
            <textarea
              value={bulkData.note}
              onChange={(e) => setBulkData({ ...bulkData, note: e.target.value })}
              className="form-input"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn btn-primary flex-1">ایجاد دسته‌ای</button>
            <button type="button" onClick={() => setBulkModalOpen(false)} className="btn btn-secondary">انصراف</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="جزئیات دستگاه"
        size="lg"
      >
        {viewingDevice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-dark-900 rounded-lg">
                <p className="text-dark-400 text-sm">سریال</p>
                <p className="text-white font-medium">{viewingDevice.serial_number}</p>
              </div>
              <div className="p-3 bg-dark-900 rounded-lg">
                <p className="text-dark-400 text-sm">محصول</p>
                <p className="text-white font-medium">{getProductName(viewingDevice.product_id)}</p>
              </div>
              <div className="p-3 bg-dark-900 rounded-lg">
                <p className="text-dark-400 text-sm">مونتاژ توسط</p>
                <p className="text-white font-medium">{getPersonName(viewingDevice.assembled_by)}</p>
              </div>
              <div className="p-3 bg-dark-900 rounded-lg">
                <p className="text-dark-400 text-sm">تست توسط</p>
                <p className="text-white font-medium">{getPersonName(viewingDevice.tested_by)}</p>
              </div>
              <div className="p-3 bg-dark-900 rounded-lg">
                <p className="text-dark-400 text-sm">تاریخ مونتاژ</p>
                <p className="text-white font-medium">{formatDate(viewingDevice.assembly_date)}</p>
              </div>
              <div className="p-3 bg-dark-900 rounded-lg">
                <p className="text-dark-400 text-sm">تاریخ تست</p>
                <p className="text-white font-medium">{formatDate(viewingDevice.test_date)}</p>
              </div>
              <div className="p-3 bg-dark-900 rounded-lg">
                <p className="text-dark-400 text-sm">شروع گارانتی</p>
                <p className="text-white font-medium">{formatDate(viewingDevice.warranty_start)}</p>
              </div>
              <div className="p-3 bg-dark-900 rounded-lg">
                <p className="text-dark-400 text-sm">پایان گارانتی</p>
                <p className="text-white font-medium">{formatDate(viewingDevice.warranty_end)}</p>
              </div>
            </div>
            <div className="p-3 bg-dark-900 rounded-lg">
              <p className="text-dark-400 text-sm mb-1">وضعیت</p>
              <span className={`badge badge-${DEVICE_STATUS[viewingDevice.status]?.color || 'neutral'}`}>
                {DEVICE_STATUS[viewingDevice.status]?.icon} {DEVICE_STATUS[viewingDevice.status]?.label}
              </span>
            </div>
            {viewingDevice.note && (
              <div className="p-3 bg-dark-900 rounded-lg">
                <p className="text-dark-400 text-sm">یادداشت</p>
                <p className="text-white">{viewingDevice.note}</p>
              </div>
            )}
          </div>
        )}
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
