'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { DEVICE_STATUS, formatDate } from '@/lib/constants';
import { gregorianToPersian, persianToGregorian } from '@/lib/dateUtils';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import PersianDatePicker from '@/components/PersianDatePicker';

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

  const [deviceLogs, setDeviceLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  
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
  }, [currentPage, pageSize, search, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * pageSize;
      const limit = pageSize;

      const params = {
        skip,
        limit,
        ...(search?.trim() && { serial_number: search.trim() }),
        ...(statusFilter && { status: statusFilter }),
      };

      const [devicesData, productsData, personsData] = await Promise.all([
        api.getDevices(params, false),
        api.getProducts(),
        api.getPersons(),
      ]);
      
      setDevices(devicesData?.items || devicesData || []);
      setTotalCount(devicesData?.total || devicesData?.length || 0);
      setProducts(productsData || []);
      setPersons(personsData || []);
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceLogs = async (deviceId) => {
    setLogsLoading(true);
    try {
      const logs = await api.getDeviceLogs(deviceId, { limit: 10 });
      setDeviceLogs(logs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setDeviceLogs([]);
    } finally {
      setLogsLoading(false);
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
    fetchDeviceLogs(device.id);
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
      setCurrentPage(1);
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

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

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
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="جستجو بر اساس سریال..."
              className="form-input pr-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
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
        data={devices}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="دستگاهی ثبت نشده است"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-dark-300">تعداد در صفحه:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="form-input w-20"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                اول
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                قبلی
              </button>
              
              <span className="text-dark-300 px-4">
                صفحه {currentPage} از {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                بعدی
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                آخر
              </button>
            </div>

            <div className="text-sm text-dark-300">
              نمایش {((currentPage - 1) * pageSize) + 1} تا {Math.min(currentPage * pageSize, totalCount)} از {totalCount} مورد
            </div>
          </div>
        </div>
      )}

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
              <PersianDatePicker
                label="تاریخ مونتاژ"
                value={formData.assembly_date}
                onChange={(date) => setFormData({ ...formData, assembly_date: date })}
              />
            </div>

            <div>
              <PersianDatePicker
                label="تاریخ تست"
                value={formData.test_date}
                onChange={(date) => setFormData({ ...formData, test_date: date })}
              />
            </div>

            <div>
              <PersianDatePicker
                label="شروع گارانتی"
                value={formData.warranty_start}
                onChange={(date) => setFormData({ ...formData, warranty_start: date })}
              />
            </div>

            <div>
              <PersianDatePicker
                label="پایان گارانتی"
                value={formData.warranty_end}
                onChange={(date) => setFormData({ ...formData, warranty_end: date })}
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
              <PersianDatePicker
                label="تاریخ مونتاژ"
                value={bulkData.assembly_date}
                onChange={(date) => setBulkData({ ...bulkData, assembly_date: date })}
              />
            </div>

            <div>
              <PersianDatePicker
                label="تاریخ تست"
                value={bulkData.test_date}
                onChange={(date) => setBulkData({ ...bulkData, test_date: date })}
              />
            </div>

            <div>
              <PersianDatePicker
                label="شروع گارانتی"
                value={bulkData.warranty_start}
                onChange={(date) => setBulkData({ ...bulkData, warranty_start: date })}
              />
            </div>

            <div>
              <PersianDatePicker
                label="پایان گارانتی"
                value={bulkData.warranty_end}
                onChange={(date) => setBulkData({ ...bulkData, warranty_end: date })}
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
        onClose={() => {
          setViewModalOpen(false);
          setDeviceLogs([]);
        }}
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
            <div className="p-3 bg-dark-900 rounded-lg">
              <p className="text-dark-400 text-sm mb-2">لاگ‌های دستگاه</p>
              {logsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                </div>
              ) : deviceLogs.length > 0 ? (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {deviceLogs.map((log) => (
                    <li key={log.id} className="text-sm border-r-2 border-primary-500 pr-3">
                      <div className="flex justify-between items-start">
                        <span className="text-primary-400 font-medium">{log.log_type}</span>
                        <span className="text-dark-400 text-xs">{formatDate(log.created_at)}</span>
                      </div>
                      <p className="text-white mt-1">{log.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-dark-400 text-sm text-center py-2">هیچ لاگی ثبت نشده است</p>
              )}
            </div>
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