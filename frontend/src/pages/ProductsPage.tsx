import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Barcode from 'react-barcode';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types';
import Layout from '../components/Layout';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Barcode as BarcodeIcon,
  X,
  Save,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

export default function ProductsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id === 'new' || Boolean(id);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    name_bn: '',
    barcode: '',
    price: '',
    stock: '',
    category_id: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchProductDetails(id);
    } else if (id === 'new') {
      setShowForm(true);
      generateBarcode();
    }
  }, [id]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    setCategories(data || []);
  };

  const fetchProductDetails = async (productId: string) => {
    const { data } = await supabase
      .from('products')
      .select('*, categories(*)')
      .eq('id', productId)
      .maybeSingle();

    if (data) {
      setSelectedProduct(data);
      setFormData({
        name: data.name,
        name_bn: data.name_bn,
        barcode: data.barcode,
        price: String(data.price),
        stock: String(data.stock),
        category_id: data.category_id || '',
      });
      setShowForm(true);
    }
  };

  const generateBarcode = () => {
    const barcode = Math.floor(Math.random() * 9000000000000) + 1000000000000;
    setFormData((prev) => ({ ...prev, barcode: String(barcode) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.price || !formData.barcode) {
      setError(t('productNameRequired'));
      return;
    }

    setSaving(true);
    try {
      const productData = {
        name: formData.name,
        name_bn: formData.name_bn || formData.name,
        barcode: formData.barcode,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        category_id: formData.category_id || null,
      };

      let error;
      if (selectedProduct) {
        ({ error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', selectedProduct.id));
      } else {
        ({ error } = await supabase.from('products').insert([productData]));
      }

      if (error) throw error;

      await fetchProducts();
      handleCloseForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm(t('deleteConfirm'))) return;

    setDeleting(productId);
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      setProducts(products.filter((p) => p.id !== productId));
    } finally {
      setDeleting(null);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedProduct(null);
    setFormData({
      name: '',
      name_bn: '',
      barcode: '',
      price: '',
      stock: '',
      category_id: '',
    });
    navigate('/products');
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.name_bn.includes(searchQuery) ||
      product.barcode.includes(searchQuery)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (showForm) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleCloseForm}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-bangla"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('products')}
          </button>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 font-bangla">
                {selectedProduct ? t('editProduct') : t('addNewProduct')}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-bangla">{error}</span>
                </div>
              )}

              {/* Barcode Preview */}
              {formData.barcode && (
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl mb-6">
                  <Barcode
                    value={formData.barcode}
                    width={2}
                    height={80}
                    fontSize={16}
                    margin={10}
                  />
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium font-bangla"
                  >
                    {t('generateBarcode')}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 font-bangla">
                    {t('productName')}*
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bangla"
                    placeholder={t('enterProductName')}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 font-bangla">
                    {t('productNameBn')}
                  </label>
                  <input
                    type="text"
                    value={formData.name_bn}
                    onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bangla"
                    placeholder={t('enterProductNameBn')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 font-bangla">
                    {t('price')}*
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bangla"
                    placeholder={t('enterPrice')}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 font-bangla">
                    {t('stock')}
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bangla"
                    placeholder={t('enterStock')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 font-bangla">
                  {t('category')}
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bangla"
                >
                  <option value="">{t('selectCategory')}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_bn} ({cat.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 font-bangla">
                  {t('barcode')}*
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bangla"
                  />
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-bangla whitespace-nowrap"
                  >
                    <BarcodeIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-bangla"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {t('saveSuccess')}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bangla"
                >
                  {t('cancelSale')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-bangla">
              {t('products')}
            </h1>
            <p className="text-gray-500 mt-1 font-bangla">
              {products.length} {t('items')}
            </p>
          </div>
          <button
            onClick={() => navigate('/products/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all font-bangla"
          >
            <Plus className="w-5 h-5" />
            {t('addNewProduct')}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bangla"
            placeholder={t('searchProducts')}
          />
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bangla">{t('noProducts')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="aspect-square bg-gray-100 p-4 flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center">
                      <Package className="w-12 h-12 text-gray-400 mb-2" />
                      <svg className="w-full max-w-[140px]">
                        <Barcode
                          value={product.barcode}
                          width={1.5}
                          height={40}
                          fontSize={10}
                          margin={2}
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 font-bangla line-clamp-1">
                      {product.name_bn || product.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        product.stock < 10
                          ? 'bg-red-100 text-red-700'
                          : product.stock < 20
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {product.stock}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 font-bangla">
                    {product.barcode}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-emerald-600 font-bangla">
                      {formatCurrency(product.price)}
                    </p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/products/${product.id}`)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deleting === product.id}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        {deleting === product.id ? (
                          <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
