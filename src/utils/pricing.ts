import { CurrencyOption } from '../types/pricing';

export const getCurrencyOptions = (): CurrencyOption[] => [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
];

export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  const currency = getCurrencyOptions().find(c => c.code === currencyCode);
  const symbol = currency?.symbol || currencyCode;
  
  // Format number with commas and 2 decimal places
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `${symbol}${formattedAmount}`;
};

export const calculateFinalPrice = (unitPrice: number, surchargePercent?: number): number => {
  if (!surchargePercent) return unitPrice;
  return unitPrice * (1 + surchargePercent / 100);
};

export const formatDateRange = (startDate: string, endDate?: string): string => {
  const start = new Date(startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  
  if (!endDate) return `${start} - Ongoing`;
  
  const end = new Date(endDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  
  return `${start} - ${end}`;
};

export const getPriceListStatus = (startDate: string, endDate?: string): {
  status: 'active' | 'future' | 'expired';
  label: string;
  color: string;
} => {
  const today = new Date().toISOString().split('T')[0];
  const start = startDate;
  const end = endDate;
  
  if (start > today) {
    return {
      status: 'future',
      label: 'Future',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    };
  }
  
  if (end && end < today) {
    return {
      status: 'expired',
      label: 'Expired',
      color: 'bg-red-100 text-red-800 border-red-200',
    };
  }
  
  return {
    status: 'active',
    label: 'Active',
    color: 'bg-green-100 text-green-800 border-green-200',
  };
};

export const validateDateRange = (startDate: string, endDate?: string): boolean => {
  if (!endDate) return true;
  return new Date(startDate) <= new Date(endDate);
};

export const isExpiringSoon = (endDate?: string, days: number = 30): boolean => {
  if (!endDate) return false;
  
  const today = new Date();
  const expiry = new Date(endDate);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry <= days && daysUntilExpiry >= 0;
};