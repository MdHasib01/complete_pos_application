import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // App
      appName: 'Super Shop POS',
      welcome: 'Welcome',

      // Auth
      login: 'Login',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      createAccount: 'Create Account',
      forgotPassword: 'Forgot Password?',
      loginError: 'Invalid email or password',
      signupSuccess: 'Account created successfully',
      signupError: 'Failed to create account',

      // Navigation
      dashboard: 'Dashboard',
      products: 'Products',
      allProducts: 'All Products',
      categories: 'Categories',
      sales: 'Sales',
      reports: 'Reports',
      settings: 'Settings',

      // Dashboard
      todaySales: "Today's Sales",
      totalProducts: 'Total Products',
      lowStock: 'Low Stock',
      totalCategories: 'Categories',
      recentSales: 'Recent Sales',
      quickActions: 'Quick Actions',
      newSale: 'New Sale',
      addProduct: 'Add Product',
      viewAll: 'View All',

      // Products
      productName: 'Product Name',
      productNameBn: 'Product Name (Bangla)',
      barcode: 'Barcode',
      price: 'Price',
      stock: 'Stock',
      category: 'Category',
      image: 'Image',
      addNewProduct: 'Add New Product',
      editProduct: 'Edit Product',
      deleteProduct: 'Delete Product',
      scanBarcode: 'Scan Barcode',
      generateBarcode: 'Generate Barcode',
      productImage: 'Product Image',
      uploadImage: 'Upload',
      removeImage: 'Remove image',
      productNameRequired: 'Product name is required',
      priceRequired: 'Price is required',

      // Categories
      categoryName: 'Category Name',
      categoryNameBn: 'Category Name (Bangla)',
      addNewCategory: 'Add New Category',
      editCategory: 'Edit Category',
      deleteCategory: 'Delete Category',

      // Sales
      invoiceNumber: 'Invoice Number',
      date: 'Date',
      total: 'Total',
      paymentMethod: 'Payment Method',
      cash: 'Cash',
      card: 'Card',
      mobile: 'Mobile',
      items: 'Items',
      quantity: 'Quantity',
      subtotal: 'Subtotal',
      tax: 'Tax',
      discount: 'Discount',
      grandTotal: 'Grand Total',
      complete: 'Complete',
      cancelSale: 'Cancel Sale',
      addToCart: 'Add to Cart',
      cart: 'Cart',
      checkout: 'Checkout',
      printReceipt: 'Print Receipt',

      // Messages
      saveSuccess: 'Saved successfully',
      saveError: 'Failed to save',
      deleteConfirm: 'Are you sure you want to delete?',
      deleteSuccess: 'Deleted successfully',
      deleteError: 'Failed to delete',
      noProducts: 'No products found',
      noSales: 'No sales found',
      loading: 'Loading...',

      // Currency
      bdt: 'BDT',
      taka: '৳',

      // Placeholders
      enterEmail: 'Enter your email',
      enterPassword: 'Enter your password',
      searchProducts: 'Search products...',
      enterProductName: 'Enter product name',
      enterProductNameBn: 'Enter product name in Bangla',
      enterPrice: 'Enter price',
      enterStock: 'Enter stock quantity',
      selectCategory: 'Select category',
    },
  },
  bn: {
    translation: {
      // App
      appName: 'সুপার শপ POS',
      welcome: 'স্বাগতম',

      // Auth
      login: 'লগইন',
      logout: 'লগআউট',
      email: 'ইমেইল',
      password: 'পাসওয়ার্ড',
      confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
      signIn: 'সাইন ইন',
      signUp: 'সাইন আপ',
      noAccount: 'অ্যাকাউন্ট নেই?',
      hasAccount: 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
      createAccount: 'অ্যাকাউন্ট তৈরি করুন',
      forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
      loginError: 'ইমেইল বা পাসওয়ার্ড ভুল',
      signupSuccess: 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে',
      signupError: 'অ্যাকাউন্ট তৈরি করতে ব্যর্থ',

      // Navigation
      dashboard: 'ড্যাশবোর্ড',
      products: 'পণ্য',
      allProducts: 'সব পণ্য',
      categories: 'ক্যাটাগরি',
      sales: 'বিক্রয়',
      reports: 'রিপোর্ট',
      settings: 'সেটিংস',

      // Dashboard
      todaySales: 'আজকের বিক্রয়',
      totalProducts: 'মোট পণ্য',
      lowStock: 'স্টক কম',
      totalCategories: 'ক্যাটাগরি',
      recentSales: 'সাম্প্রতিক বিক্রয়',
      quickActions: 'দ্রুত কার্য',
      newSale: 'নতুন বিক্রয়',
      addProduct: 'পণ্য যোগ করুন',
      viewAll: 'সব দেখুন',

      // Products
      productName: 'পণ্যের নাম',
      productNameBn: 'পণ্যের নাম (বাংলা)',
      barcode: 'বারকোড',
      price: 'দাম',
      stock: 'স্টক',
      category: 'ক্যাটাগরি',
      image: 'ছবি',
      addNewProduct: 'নতুন পণ্য যোগ করুন',
      editProduct: 'পণ্য সম্পাদনা',
      deleteProduct: 'পণ্য মুছুন',
      scanBarcode: 'বারকোড স্ক্যান',
      generateBarcode: 'বারকোড তৈরি',
      productImage: 'পণ্যের ছবি',
      uploadImage: 'আপলোড',
      removeImage: 'ছবি সরান',
      productNameRequired: 'পণ্যের নাম আবশ্যক',
      priceRequired: 'দাম আবশ্যক',

      // Categories
      categoryName: 'ক্যাটাগরির নাম',
      categoryNameBn: 'ক্যাটাগরির নাম (বাংলা)',
      addNewCategory: 'নতুন ক্যাটাগরি যোগ করুন',
      editCategory: 'ক্যাটাগরি সম্পাদনা',
      deleteCategory: 'ক্যাটাগরি মুছুন',

      // Sales
      invoiceNumber: 'চালান নম্বর',
      date: 'তারিখ',
      total: 'মোট',
      paymentMethod: 'পেমেন্ট পদ্ধতি',
      cash: 'নগদ',
      card: 'কার্ড',
      mobile: 'মোবাইল',
      items: 'পণ্য',
      quantity: 'পরিমাণ',
      subtotal: 'উপ-মোট',
      tax: 'কর',
      discount: 'ছাড়',
      grandTotal: 'মোট',
      complete: 'সম্পূর্ণ',
      cancelSale: 'বিক্রয় বাতিল',
      addToCart: 'কার্টে যোগ করুন',
      cart: 'কার্ট',
      checkout: 'চেকআউট',
      printReceipt: 'রশিদ প্রিন্ট',

      // Messages
      saveSuccess: 'সফলভাবে সংরক্ষিত',
      saveError: 'সংরক্ষণ করতে ব্যর্থ',
      deleteConfirm: 'আপনি কি নিশ্চিত মুছতে চান?',
      deleteSuccess: 'সফলভাবে মুছে ফেলা হয়েছে',
      deleteError: 'মুছতে ব্যর্থ',
      noProducts: 'কোনো পণ্য পাওয়া যায়নি',
      noSales: 'কোনো বিক্রয় পাওয়া যায়নি',
      loading: 'লোড হচ্ছে...',

      // Currency
      bdt: 'টাকা',
      taka: '৳',

      // Placeholders
      enterEmail: 'আপনার ইমেইল দিন',
      enterPassword: 'আপনার পাসওয়ার্ড দিন',
      searchProducts: 'পণ্য খুঁজুন...',
      enterProductName: 'পণ্যের নাম দিন',
      enterProductNameBn: 'বাংলায় পণ্যের নাম দিন',
      enterPrice: 'দাম দিন',
      enterStock: 'স্টক পরিমাণ দিন',
      selectCategory: 'ক্যাটাগরি নির্বাচন করুন',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'bn',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
