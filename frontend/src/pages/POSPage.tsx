import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types';
import { useCart } from '../context/CartContext';
import Layout from '../components/Layout';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  CheckCircle,
  Loader2,
} from 'lucide-react';

export default function POSPage() {
  const { t } = useTranslation();
  const { items, addToCart, removeFromCart, updateQuantity, clearCart, total, itemCount } =
    useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [processing, setProcessing] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState('');
  const [saleComplete, setSaleComplete] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*, categories(*)').gt('stock', 0),
        supabase.from('categories').select('*'),
      ]);

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.name_bn.includes(searchQuery) ||
      product.barcode.includes(searchQuery);
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            total,
            payment_method: paymentMethod,
          },
        ])
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = items.map((item) => ({
        sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);

      if (itemsError) throw itemsError;

      // Update stock
      for (const item of items) {
        await supabase
          .from('products')
          .update({ stock: item.product.stock - item.quantity })
          .eq('id', item.product.id);
      }

      setSaleComplete(true);
      setTimeout(() => {
        clearCart();
        setShowCheckout(false);
        setSaleComplete(false);
        setPaymentReceived('');
        fetchData();
      }, 2000);
    } finally {
      setProcessing(false);
    }
  };

  const change = paymentReceived ? parseFloat(paymentReceived) - total : 0;

  if (showCheckout) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 font-bangla">{t('checkout')}</h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {saleComplete ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 font-bangla mb-2">
                  {t('complete')}
                </h3>
                <p className="text-gray-500 font-bangla">{t('saveSuccess')}</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Order Summary */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-medium">
                        {item.quantity}x
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 font-bangla text-sm">
                          {item.product.name_bn}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(item.product.price)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.product.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-600 font-bangla">{t('total')}</span>
                    <span className="font-bold text-xl text-emerald-600">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 font-bangla">
                    {t('paymentMethod')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash', icon: Banknote, label: t('cash') },
                      { id: 'card', icon: CreditCard, label: t('card') },
                      { id: 'mobile', icon: Smartphone, label: t('mobile') },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as typeof paymentMethod)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          paymentMethod === method.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <method.icon
                          className={`w-6 h-6 ${
                            paymentMethod === method.id ? 'text-emerald-600' : 'text-gray-400'
                          }`}
                        />
                        <span
                          className={`text-sm font-medium font-bangla ${
                            paymentMethod === method.id ? 'text-emerald-700' : 'text-gray-600'
                          }`}
                        >
                          {method.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash Payment - Amount Received */}
                {paymentMethod === 'cash' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 font-bangla">
                      {t('paymentMethod')}
                    </label>
                    <input
                      type="number"
                      value={paymentReceived}
                      onChange={(e) => setPaymentReceived(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xl font-semibold text-center font-bangla"
                      placeholder="0"
                    />
                    {parseFloat(paymentReceived) >= total && (
                      <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                        <span className="text-emerald-700 font-bangla">Change</span>
                        <span className="text-lg font-bold text-emerald-700">
                          {formatCurrency(change)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 font-bangla text-lg"
                >
                  {processing ? (
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  ) : (
                    `${t('complete')} - ${formatCurrency(total)}`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] lg:h-auto">
        {/* Products Section */}
        <div className="flex-1 space-y-4">
          {/* Search & Filter */}
          <div className="bg-white rounded-xl p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bangla"
                placeholder={t('searchProducts')}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors font-bangla ${
                  !selectedCategory
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('allProducts')}
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors font-bangla ${
                    selectedCategory === category.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.name_bn}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="h-24 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-bangla">{t('noProducts')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden text-left group"
                  >
                    <div className="aspect-square bg-gray-100 p-3 flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-gray-300" />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-sm font-bangla line-clamp-2 mb-1">
                        {product.name_bn}
                      </h3>
                      <p className="text-lg font-bold text-emerald-600">
                        {formatCurrency(product.price)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Stock: {product.stock}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:w-80 xl:w-96 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 font-bangla">{t('cart')}</h2>
                <p className="text-sm text-gray-500">
                  {itemCount} {t('items')}
                </p>
              </div>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-gray-500 font-bangla">{t('noProducts')}</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm font-bangla truncate">
                        {item.product.name_bn}
                      </h3>
                      <p className="text-emerald-600 font-semibold text-sm">
                        {formatCurrency(item.product.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-4 h-4 text-gray-600" />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-5 border-t border-gray-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-bangla">{t('total')}</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(total)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-bangla"
                  >
                    {t('cancelSale')}
                  </button>
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all font-bangla"
                  >
                    {t('checkout')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
