import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Sale, SaleItem, Product } from '../types';
import Layout from '../components/Layout';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Eye,
  X,
  Package,
} from 'lucide-react';

interface SaleWithDetails extends Sale {
  items: (SaleItem & { products: Product | null })[];
}

export default function SalesPage() {
  const { t } = useTranslation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);

  useEffect(() => {
    fetchSales();
  }, [selectedDate]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await api.getSales(selectedDate);
      setSales(data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleDetails = async (saleId: string) => {
    const data = await api.getSale(saleId);
    if (data) {
      setSelectedSale({
        ...data,
        items: (data.items || []) as SaleWithDetails['items'],
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const formatDateDisplay = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'mobile':
        return '📱';
      default:
        return '';
    }
  };

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-bangla">
            {t('sales')}
          </h1>
          <p className="text-gray-500 mt-1 font-bangla">{t('recentSales')}</p>
        </div>

        {/* Date Navigation */}
        <div className="bg-white rounded-xl p-4 flex items-center justify-between">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span className="font-medium text-gray-900 font-bangla">
              {formatDateDisplay(selectedDate)}
            </span>
          </div>
          <button
            onClick={() => navigateDate(1)}
            disabled={
              new Date(selectedDate).toISOString().split('T')[0] ===
              new Date().toISOString().split('T')[0]
            }
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-500 font-bangla">{t('items')}</p>
            <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-gray-500 font-bangla">{t('total')}</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalSales)}
            </p>
          </div>
          {['cash', 'card', 'mobile'].map((method) => (
            <div key={method} className="bg-white rounded-xl p-4">
              <p className="text-sm text-gray-500 font-bangla">{t(method)}</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(
                  sales
                    .filter((s) => s.payment_method === method)
                    .reduce((sum, s) => sum + Number(s.total), 0)
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Sales List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bangla">{t('noSales')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-50">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <span className="text-2xl">{getPaymentMethodIcon(sale.payment_method)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 font-bangla">
                        {sale.invoice_number}
                      </p>
                      <p className="text-sm text-gray-500 font-bangla">
                        {formatDateTime(sale.created_at)} • {t(sale.payment_method)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold text-emerald-600">
                      {formatCurrency(Number(sale.total))}
                    </p>
                    <button
                      onClick={() => fetchSaleDetails(sale.id)}
                      className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5 text-emerald-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 font-bangla">
                  {selectedSale.invoice_number}
                </h2>
                <p className="text-sm text-gray-500 font-bangla">
                  {formatDateTime(selectedSale.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedSale.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 font-bangla text-sm">
                      {item.products?.name_bn || item.products?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-bangla">{t('paymentMethod')}</span>
                <span className="font-medium text-gray-900 font-bangla">
                  {getPaymentMethodIcon(selectedSale.payment_method)} {t(selectedSale.payment_method)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-semibold font-bangla">{t('total')}</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(Number(selectedSale.total))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
