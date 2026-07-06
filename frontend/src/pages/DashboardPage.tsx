import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Product, Sale } from '../types';
import Layout from '../components/Layout';
import {
  DollarSign,
  Package,
  AlertTriangle,
  Tags,
  TrendingUp,
  ShoppingCart,
  Plus,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todaySales: 0,
    totalProducts: 0,
    lowStock: 0,
    totalCategories: 0,
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [salesRes, productsRes, categoriesRes] = await Promise.all([
        supabase
          .from('sales')
          .select('id, invoice_number, total, created_at')
          .gte('created_at', today.toISOString())
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('products').select('id, stock'),
        supabase.from('categories').select('id'),
      ]);

      const todaySalesTotal =
        salesRes.data?.reduce((sum: number, sale) => sum + Number(sale.total), 0) || 0;
      const lowStockCount = productsRes.data?.filter((p) => p.stock < 10).length || 0;

      setStats({
        todaySales: todaySalesTotal,
        totalProducts: productsRes.data?.length || 0,
        lowStock: lowStockCount,
        totalCategories: categoriesRes.data?.length || 0,
      });

      setRecentSales(salesRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statCards = [
    {
      title: t('todaySales'),
      value: formatCurrency(stats.todaySales),
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50',
    },
    {
      title: t('totalProducts'),
      value: stats.totalProducts,
      icon: Package,
      gradient: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50',
    },
    {
      title: t('lowStock'),
      value: stats.lowStock,
      icon: AlertTriangle,
      gradient: 'from-orange-500 to-red-600',
      bgLight: 'bg-orange-50',
      highlight: stats.lowStock > 0,
    },
    {
      title: t('totalCategories'),
      value: stats.totalCategories,
      icon: Tags,
      gradient: 'from-purple-500 to-pink-600',
      bgLight: 'bg-purple-50',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-bangla">
              {t('dashboard')}
            </h1>
            <p className="text-gray-500 mt-1 font-bangla">{t('welcome')}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/pos')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all font-bangla"
            >
              <ShoppingCart className="w-5 h-5" />
              {t('newSale')}
            </button>
            <button
              onClick={() => navigate('/products/new')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all font-bangla"
            >
              <Plus className="w-5 h-5" />
              {t('addProduct')}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 lg:p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`relative overflow-hidden bg-white rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow ${
                    stat.highlight ? 'ring-2 ring-orange-200' : ''
                  }`}
                >
                  <div
                    className={`absolute -top-3 -right-3 w-20 h-20 rounded-full opacity-10 bg-gradient-to-br ${stat.gradient}`}
                  ></div>
                  <div
                    className={`w-12 h-12 rounded-xl ${stat.bgLight} flex items-center justify-center mb-3`}
                  >
                    <Icon className="w-6 h-6 text-gray-700" />
                  </div>
                  <p className="text-sm text-gray-500 font-bangla">{stat.title}</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1 font-bangla">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 font-bangla">
            {t('quickActions')}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: ShoppingCart, label: t('newSale'), path: '/pos', color: 'emerald' },
              { icon: Plus, label: t('addProduct'), path: '/products/new', color: 'blue' },
              { icon: Package, label: t('products'), path: '/products', color: 'purple' },
              { icon: Tags, label: t('categories'), path: '/categories', color: 'orange' },
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className={`flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-all group ${
                    action.color === 'emerald'
                      ? 'border-l-4 border-emerald-500'
                      : action.color === 'blue'
                      ? 'border-l-4 border-blue-500'
                      : action.color === 'purple'
                      ? 'border-l-4 border-purple-500'
                      : 'border-l-4 border-orange-500'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      action.color === 'emerald'
                        ? 'bg-emerald-100'
                        : action.color === 'blue'
                        ? 'bg-blue-100'
                        : action.color === 'purple'
                        ? 'bg-purple-100'
                        : 'bg-orange-100'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        action.color === 'emerald'
                          ? 'text-emerald-600'
                          : action.color === 'blue'
                          ? 'text-blue-600'
                          : action.color === 'purple'
                          ? 'text-purple-600'
                          : 'text-orange-600'
                      }`}
                    />
                  </div>
                  <span className="font-medium text-gray-700 font-bangla">{action.label}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 font-bangla">
              {t('recentSales')}
            </h2>
            <button
              onClick={() => navigate('/sales')}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium font-bangla"
            >
              {t('viewAll')}
            </button>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
                </div>
              ))}
            </div>
          ) : recentSales.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-bangla">{t('noSales')}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 font-bangla">
                        {sale.invoice_number}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-bangla">{formatDate(sale.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 font-bangla">
                      {formatCurrency(Number(sale.total))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
