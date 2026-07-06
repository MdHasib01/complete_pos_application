import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Permissions } from '../types';
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  LogOut,
  Menu,
  Store,
  Globe,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'dashboard', permission: Permissions.ViewDashboard },
  { path: '/products', icon: Package, labelKey: 'products', permission: Permissions.ViewProducts },
  { path: '/categories', icon: Tags, labelKey: 'categories', permission: Permissions.ViewCategories },
  { path: '/sales', icon: ShoppingCart, labelKey: 'sales', permission: Permissions.ViewSales },
  { path: '/pos', icon: ShoppingCart, labelKey: 'newSale', permission: Permissions.CreateSale },
];

export default function Layout({ children }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNavItems = navItems.filter((item) => hasPermission(item.permission));

  const toggleLanguage = () => {
    const newLang = i18n.language === 'bn' ? 'en' : 'bn';
    i18n.changeLanguage(newLang);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 font-bangla">{t('appName')}</h1>
              <p className="text-xs text-gray-500 font-bangla">Point of Sale</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bangla ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{t(item.labelKey)}</span>
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="px-4 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-4 py-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-sm font-medium text-emerald-700">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate font-bangla">
                  {user?.name || user?.email}
                </p>
                {user?.role && (
                  <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">
                    {user.role}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleLanguage}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-lg transition-colors font-bangla"
              >
                <Globe className="w-4 h-4" />
                {i18n.language === 'bn' ? 'EN' : 'বাংলা'}
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-bangla"
              >
                <LogOut className="w-4 h-4" />
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200 px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900 font-bangla">{t('appName')}</span>
            </div>
            <div className="hidden lg:block"></div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-lg transition-colors font-bangla"
              >
                <Globe className="w-4 h-4" />
                {i18n.language === 'bn' ? 'English' : 'বাংলা'}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
