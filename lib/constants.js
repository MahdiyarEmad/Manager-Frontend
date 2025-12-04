// Persian Labels and Constants

export const LABELS = {
  appName: 'مارو منیجر',
  welcome: 'به سیستم مدیریت گارانتی و تعمیرات خوش آمدید',
  login: 'ورود',
  logout: 'خروج',
  register: 'ثبت‌نام',
  
  // Menu
  dashboard: 'داشبورد',
  persons: 'پرسنل',
  products: 'محصولات',
  devices: 'دستگاه‌ها',
  repairs: 'تعمیرات',
  tests: 'تست‌ها',
  warranty: 'استعلام گارانتی',
  account: 'حساب کاربری',
  settings: 'تنظیمات',

  // CRUD
  list: 'لیست',
  create: 'جدید',
  view: 'مشاهده',
  edit: 'ویرایش',
  delete: 'حذف',
  save: 'ذخیره',
  cancel: 'انصراف',
  back: 'بازگشت',
  search: 'جستجو',
  filter: 'فیلتر',
  all: 'همه',

  // Person fields
  fullName: 'نام و نام خانوادگی',
  jobRole: 'سمت',
  phone: 'تلفن',
  hireDate: 'تاریخ استخدام',
  note: 'یادداشت',

  // Product fields
  name: 'نام',
  model: 'مدل',
  category: 'دسته‌بندی',
  extra: 'اطلاعات اضافی',

  // Device fields
  serialNumber: 'سریال',
  productId: 'محصول',
  assembledBy: 'مونتاژ توسط',
  testedBy: 'تست توسط',
  assemblyDate: 'تاریخ مونتاژ',
  testDate: 'تاریخ تست',
  warrantyStart: 'شروع گارانتی',
  warrantyEnd: 'پایان گارانتی',
  status: 'وضعیت',

  // Repair fields
  deviceId: 'دستگاه',
  reportedIssue: 'مشکل گزارش شده',
  repairActions: 'اقدامات تعمیر',
  repairedBy: 'تعمیر توسط',
  repairDate: 'تاریخ تعمیر',
  isWarrantyRepair: 'تعمیر گارانتی',
  cost: 'هزینه',

  // Test fields
  testerId: 'تستر',
  testName: 'نام تست',
  testResult: 'نتیجه تست',
  notes: 'یادداشت‌ها',

  // Common
  id: 'شناسه',
  createdAt: 'تاریخ ایجاد',
  yes: 'بله',
  no: 'خیر',
  username: 'نام کاربری',
  password: 'رمز عبور',
  rememberMe: 'مرا به خاطر بسپار',
  optional: '(اختیاری)',
  required: '(الزامی)',
  loading: 'در حال بارگذاری...',
  noData: 'داده‌ای یافت نشد',
  success: 'عملیات با موفقیت انجام شد',
  error: 'خطا',
  confirm: 'تایید',
  confirmDelete: 'آیا از حذف این مورد اطمینان دارید؟',
  
  // Warranty
  warrantyActive: 'گارانتی فعال',
  warrantyExpired: 'گارانتی منقضی',
  daysRemaining: 'روز باقی‌مانده',
  repairHistory: 'سابقه تعمیرات',
};

export const JOB_ROLES = {
  assembler: 'مونتاژکار',
  tester: 'تستر',
  repairman: 'تعمیرکار',
  quality: 'کنترل کیفیت',
  operator: 'اپراتور',
};

export const DEVICE_STATUS = {
  active: { label: 'فعال', color: 'success', icon: '🟢' },
  in_repair: { label: 'در حال تعمیر', color: 'warning', icon: '🟡' },
  repaired: { label: 'تعمیر شده', color: 'info', icon: '🔵' },
  scrapped: { label: 'اسقاط', color: 'neutral', icon: '⚫' },
};

export const TEST_RESULTS = {
  passed: { label: 'قبول', color: 'success', icon: '✅' },
  warning: { label: 'هشدار', color: 'warning', icon: '⚠️' },
  failed: { label: 'مردود', color: 'danger', icon: '❌' },
};

export const ACCOUNT_ROLES = {
  admin: 'مدیر',
  manager: 'سرپرست',
  viewer: 'مشاهده‌کننده',
};

// Convert to Persian numbers
export function toPersianNum(num) {
  if (num === null || num === undefined) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
}

// Format date to Persian
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fa-IR');
  } catch {
    return dateStr;
  }
}

// Format datetime to Persian
export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('fa-IR');
  } catch {
    return dateStr;
  }
}

// Format price with comma separator
export function formatPrice(price) {
  if (!price && price !== 0) return '-';
  return toPersianNum(price.toLocaleString()) + ' تومان';
}
