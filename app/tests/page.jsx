'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { TEST_RESULTS, formatDate } from '@/lib/constants';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import PersianDatePicker from '@/components/PersianDatePicker';

export default function TestsPage() {
  const [tests, setTests] = useState([]);
  const [devices, setDevices] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  
  const [formData, setFormData] = useState({
    device_id: '',
    tester_id: '',
    test_name: '',
    test_result: 'passed',
    notes: '',
  });

  const [bulkData, setBulkData] = useState({
    prefix: '',
    start_serial: '',
    end_serial: '',
    tests_per_device: '1',
    default_tests: [{ name: '', result: 'passed', notes: '' }],
    tester_id: '',
  });

  const [bulkReview, setBulkReview] = useState([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [deviceGroups, setDeviceGroups] = useState([]);

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, search, resultFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * pageSize;
      const limit = pageSize;

      const params = {
        skip,
        limit,
        ...(search?.trim() && { search: search.trim() }),
        ...(resultFilter && { test_result: resultFilter }),
      };

      const [testsData, devicesData, personsData] = await Promise.all([
        api.getTests(params, false),
        api.getDevices({}, true),
        api.getPersons(),
      ]);
      
      setTests(testsData?.items || testsData || []);
      setTotalCount(testsData?.total || testsData?.length || 0);
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

  const prepareBulkTests = async () => {
    const { prefix, start_serial, end_serial, tests_per_device, default_tests, tester_id } = bulkData;
    
    let serials = [];
    
    if (prefix && prefix.length > 0) {
      if (!/^[0-9]+$/.test(start_serial) || !/^[0-9]+$/.test(end_serial)) {
        setToast({ message: 'وقتی پیشوند وارد شده است، فقط شماره‌ها را وارد کنید', type: 'error' });
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
        serials.push(`${prefix}${String(n).padStart(padLength, '0')}`);
      }
    } else {
      const startMatch = String(start_serial || '').match(/^(.*?)(\d+)$/);
      const endMatch = String(end_serial || '').match(/^(.*?)(\d+)$/);
      
      if (!startMatch || !endMatch) {
        setToast({ message: 'فرمت سریال نامعتبر است', type: 'error' });
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
        serials.push(`${prefixFromInput}${String(n).padStart(padLength, '0')}`);
      }
    }

    // Fetch devices by serial and group tests by device
    const groups = [];
    const testsCount = parseInt(tests_per_device) || 1;
    
    for (const serial of serials) {
      try {
        const device = await api.getDeviceBySerial(serial);
        if (device) {
          const deviceTests = [];
          for (let i = 0; i < testsCount; i++) {
            const defaultTest = default_tests[i] || default_tests[0];
            deviceTests.push({
              test_name: defaultTest.name || '',
              test_result: defaultTest.result || 'passed',
              notes: defaultTest.notes || '',
              tester_id: tester_id ? parseInt(tester_id) : null,
            });
          }
          groups.push({
            device_id: device.id,
            serial_number: serial,
            tests: deviceTests
          });
        }
      } catch (error) {
        console.error(`Device with serial ${serial} not found`);
      }
    }

    if (groups.length === 0) {
      setToast({ message: 'هیچ دستگاهی با سریال‌های وارد شده یافت نشد', type: 'error' });
      return;
    }

    setDeviceGroups(groups);
    setCurrentDeviceIndex(0);
    setReviewMode(true);
  };

  const handleNextDevice = () => {
    if (currentDeviceIndex < deviceGroups.length - 1) {
      setCurrentDeviceIndex(currentDeviceIndex + 1);
    }
  };

  const handlePrevDevice = () => {
    if (currentDeviceIndex > 0) {
      setCurrentDeviceIndex(currentDeviceIndex - 1);
    }
  };

  const updateCurrentDeviceTest = (testIndex, field, value) => {
    const updated = [...deviceGroups];
    updated[currentDeviceIndex].tests[testIndex][field] = value;
    setDeviceGroups(updated);
  };

  const handleBulkSubmit = async () => {
    try {
      let totalCreated = 0;
      
      for (const group of deviceGroups) {
        for (const test of group.tests) {
          await api.createTest({
            device_id: group.device_id,
            test_name: test.test_name,
            test_result: test.test_result,
            notes: test.notes,
            tester_id: test.tester_id,
          });
          totalCreated++;
        }
      }
      
      setToast({ message: `${totalCreated} تست با موفقیت ایجاد شد`, type: 'success' });
      resetBulkForm();
      setCurrentPage(1);
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
      test_result: test.test_result || 'passed',
      notes: test.notes || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این تست مطمئن هستید?')) return;
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
      test_result: 'passed',
      notes: '',
    });
  };

  const resetBulkForm = () => {
    setBulkData({
      prefix: '',
      start_serial: '',
      end_serial: '',
      tests_per_device: '1',
      default_tests: [{ name: '', result: 'passed', notes: '' }],
      tester_id: '',
    });
    setDeviceGroups([]);
    setCurrentDeviceIndex(0);
    setReviewMode(false);
    setBulkModalOpen(false);
  };

  const updateDefaultTest = (index, field, value) => {
    const updated = [...bulkData.default_tests];
    updated[index][field] = value;
    setBulkData({ ...bulkData, default_tests: updated });
  };

  const addDefaultTest = () => {
    setBulkData({
      ...bulkData,
      default_tests: [...bulkData.default_tests, { name: '', result: 'passed', notes: '' }]
    });
  };

  const removeDefaultTest = (index) => {
    const updated = bulkData.default_tests.filter((_, i) => i !== index);
    setBulkData({ ...bulkData, default_tests: updated.length ? updated : [{ name: '', result: 'passed', notes: '' }] });
  };

  const getDeviceSerial = (id) => {
    const device = devices.find(d => d.id === id);
    return device?.serial_number || '-';
  };

  const getPersonName = (id) => {
    const person = persons.find(p => p.id === id);
    return person?.full_name || '-';
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleResultFilterChange = (value) => {
    setResultFilter(value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const currentDevice = deviceGroups[currentDeviceIndex];
  const totalTests = deviceGroups.reduce((sum, group) => sum + group.tests.length, 0);

  const columns = [
    { key: 'id', label: 'شناسه', width: '70px' },
    { 
      key: 'device_serial', 
      label: 'سریال دستگاه',
      render: (value) => value
    },
    { key: 'test_name', label: 'نام تست' },
    { 
      key: 'tester_id', 
      label: 'تستر',
      render: (value) => getPersonName(value)
    },
    { 
      key: 'created_at', 
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">مدیریت تست‌ها</h1>
          <p className="text-dark-400 mt-1">لیست تست‌های انجام شده</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { resetForm(); setModalOpen(true); }} className="btn btn-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            ثبت تست
          </button>
          <button onClick={() => { setBulkModalOpen(true); }} className="btn btn-secondary">
            ایجاد دسته‌ای
          </button>
        </div>
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
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="جستجو بر اساس سریال، نام تست..."
              className="form-input pr-10"
            />
          </div>
          <select
            value={resultFilter}
            onChange={(e) => handleResultFilterChange(e.target.value)}
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
        data={tests}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="تستی ثبت نشده است"
      />

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
        title={editingTest ? 'ویرایش تست' : 'ثبت تست جدید'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-300 mb-2">دستگاه *</label>
            
            <input
              type="text"
              value={formData.device_id}
              onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
              className="form-input"
              required
            />
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

      {/* Bulk Create Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={resetBulkForm}
        title={reviewMode ? `مرور تست‌های ${currentDevice?.serial_number}` : 'ایجاد دسته‌ای تست'}
        size="xl"
      >
        {!reviewMode ? (
          <form onSubmit={(e) => { e.preventDefault(); prepareBulkTests(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-dark-300 mb-2">پیشوند (اختیاری)</label>
                <input
                  type="text"
                  value={bulkData.prefix}
                  onChange={(e) => setBulkData({ ...bulkData, prefix: e.target.value })}
                  className="form-input"
                  placeholder="مثال: DEV"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">تعداد تست در هر دستگاه *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={bulkData.tests_per_device}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 1;
                    const tests = Array.from({ length: count }, (_, i) => 
                      bulkData.default_tests[i] || { name: '', result: 'passed', notes: '' }
                    );
                    setBulkData({ ...bulkData, tests_per_device: e.target.value, default_tests: tests });
                  }}
                  className="form-input"
                  required
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
                  dir="ltr"
                  placeholder={bulkData.prefix ? '0001' : 'DEV0001'}
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
                  placeholder={bulkData.prefix ? '0010' : 'DEV0010'}
                />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">تستر پیش‌فرض</label>
                <select
                  value={bulkData.tester_id}
                  onChange={(e) => setBulkData({ ...bulkData, tester_id: e.target.value })}
                  className="form-input"
                >
                  <option value="">انتخاب کنید</option>
                  {persons.map(person => (
                    <option key={person.id} value={person.id}>{person.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-dark-700 pt-4 mt-6">
              <h3 className="text-lg font-bold text-white mb-4">تست‌های پیش‌فرض</h3>
              <div className="space-y-4">
                {bulkData.default_tests.map((test, idx) => (
                  <div key={idx} className="bg-dark-900 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">تست {idx + 1}</span>
                      {bulkData.default_tests.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDefaultTest(idx)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                    
                    <input
                      type="text"
                      value={test.name}
                      onChange={(e) => updateDefaultTest(idx, 'name', e.target.value)}
                      placeholder="نام تست *"
                      className="form-input"
                      required
                    />
                    
                    <select
                      value={test.result}
                      onChange={(e) => updateDefaultTest(idx, 'result', e.target.value)}
                      className="form-input"
                    >
                      {Object.entries(TEST_RESULTS).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    
                    <textarea
                      value={test.notes}
                      onChange={(e) => updateDefaultTest(idx, 'notes', e.target.value)}
                      placeholder="یادداشت"
                      className="form-input"
                      rows={2}
                    />
                  </div>
                ))}
                
                {/* {bulkData.default_tests.length < 10 && (
                  <button
                    type="button"
                    onClick={addDefaultTest}
                    className="w-full btn btn-secondary text-sm"
                  >
                    + افزودن تست
                  </button>
                )} */}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 btn btn-primary">
                مرور و تایید
              </button>
              <button type="button" onClick={resetBulkForm} className="btn btn-secondary">
                انصراف
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="bg-dark-900 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-dark-300">
                  دستگاه {currentDeviceIndex + 1} از {deviceGroups.length}
                </span>
                <span className="text-sm text-dark-300">
                  کل تست‌ها: {totalTests}
                </span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentDeviceIndex + 1) / deviceGroups.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left Side - Device Info */}
              <div className="bg-dark-900 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-4">اطلاعات دستگاه</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-dark-400">سریال دستگاه</p>
                    <p className="text-lg font-bold text-primary">{currentDevice?.serial_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-dark-400">تعداد تست‌ها</p>
                    <p className="text-lg font-bold text-white">{currentDevice?.tests.length}</p>
                  </div>
                  <div className="pt-4 border-t border-dark-700">
                    <p className="text-sm text-dark-400 mb-2">پیشرفت کلی</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {Math.round(((currentDeviceIndex + 1) / deviceGroups.length) * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side - Tests List */}
              <div className="bg-dark-900 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-4">لیست تست‌ها</h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {currentDevice?.tests.map((test, idx) => (
                    <div key={idx} className="bg-dark-800 p-3 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">تست {idx + 1}</span>
                      </div>
                      
                      <input
                        type="text"
                        value={test.test_name}
                        onChange={(e) => updateCurrentDeviceTest(idx, 'test_name', e.target.value)}
                        placeholder="نام تست *"
                        className="form-input text-sm"
                        required
                      />
                      
                      <select
                        value={test.test_result}
                        onChange={(e) => updateCurrentDeviceTest(idx, 'test_result', e.target.value)}
                        className="form-input text-sm"
                      >
                        {Object.entries(TEST_RESULTS).map(([key, { label, icon }]) => (
                          <option key={key} value={key}>{icon} {label}</option>
                        ))}
                      </select>
                      
                      <textarea
                        value={test.notes}
                        onChange={(e) => updateCurrentDeviceTest(idx, 'notes', e.target.value)}
                        placeholder="یادداشت"
                        className="form-input text-sm"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-dark-700">
              <button
                onClick={handlePrevDevice}
                disabled={currentDeviceIndex === 0}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                قبلی
              </button>

              <div className="flex gap-2">
                <button
                  onClick={resetBulkForm}
                  className="btn btn-secondary"
                >
                  لغو
                </button>
                
                {currentDeviceIndex === deviceGroups.length - 1 ? (
                  <button
                    onClick={handleBulkSubmit}
                    className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-lg font-medium text-white transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ثبت همه ({totalTests} تست)
                  </button>
                ) : (
                  <button
                    onClick={handleNextDevice}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    بعدی
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
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