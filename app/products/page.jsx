'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    category: '',
    extra: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data || []);
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
        setToast({ message: 'محصول با موفقیت ویرایش شد', type: 'success' });
      } else {
        await api.createProduct(formData);
        setToast({ message: 'محصول جدید با موفقیت ایجاد شد', type: 'success' });
      }
      setModalOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      model: product.model || '',
      category: product.category || '',
      extra: product.extra || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteProduct(id);
      setToast({ message: 'محصول با موفقیت حذف شد', type: 'success' });
      loadProducts();
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      model: '',
      category: '',
      extra: '',
    });
  };

  const columns = [
    { key: 'id', label: 'شناسه', width: '80px' },
    { key: 'name', label: 'نام محصول' },
    { key: 'model', label: 'مدل' },
    { 
      key: 'category', 
      label: 'دسته‌بندی',
      render: (value) => value ? (
        <span className="badge badge-info">{value}</span>
      ) : '-'
    },
  ];

  const filteredProducts = products.filter(product => 
    product.name?.toLowerCase().includes(search.toLowerCase()) ||
    product.model?.toLowerCase().includes(search.toLowerCase()) ||
    product.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">مدیریت محصولات</h1>
          <p className="text-dark-400 mt-1">لیست محصولات قابل تولید</p>
        </div>
        <button onClick={() => { resetForm(); setModalOpen(true); }} className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          افزودن محصول
        </button>
      </div>

      <div className="card">
        <div className="relative">
          <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس نام، مدل یا دسته..."
            className="form-input pr-10"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredProducts}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="محصولی ثبت نشده است"
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'ویرایش محصول' : 'افزودن محصول جدید'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-300 mb-2">نام محصول *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">مدل</label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">دسته‌بندی</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-300 mb-2">اطلاعات اضافی</label>
            <textarea
              value={formData.extra}
              onChange={(e) => setFormData({ ...formData, extra: e.target.value })}
              className="form-input"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn btn-primary flex-1">
              {editingProduct ? 'ذخیره تغییرات' : 'ایجاد محصول'}
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
