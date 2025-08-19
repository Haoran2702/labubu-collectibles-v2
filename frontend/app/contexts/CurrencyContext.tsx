"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Currency types
export type CurrencyCode = 
  | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CHF' | 'CNY' | 'INR' | 'BRL' 
  | 'MXN' | 'KRW' | 'SGD' | 'HKD' | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK' | 'HUF' 
  | 'RUB' | 'TRY' | 'ZAR' | 'THB' | 'MYR' | 'IDR' | 'PHP' | 'VND' | 'EGP' | 'ILS' 
  | 'AED' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR' | 'JOD' | 'LBP' | 'CLP' | 'ARS' 
  | 'COP' | 'PEN' | 'UYU' | 'VES' | 'NZD' | 'FJD' | 'XPF' | 'WST' | 'TOP' | 'SBD' 
  | 'VUV' | 'PGK' | 'KID' | 'TVD' | 'NIO' | 'GTQ' | 'HNL' | 'SVC' | 'BZD' | 'BBD' 
  | 'TTD' | 'JMD' | 'HTG' | 'DOP' | 'BOB' | 'PYG' | 'GYD' | 'SRD' | 'GHS' | 'NGN' 
  | 'KES' | 'UGX' | 'TZS' | 'MWK' | 'ZMW' | 'BWP' | 'NAM' | 'LSL' | 'SZL' | 'MUR' 
  | 'SCR' | 'KMF' | 'DJF' | 'SOS' | 'ETB' | 'ERN' | 'SDG' | 'SSP' | 'MAD' | 'TND' 
  | 'DZD' | 'LYD' | 'XOF' | 'XAF' | 'XCD' | 'ANG' | 'AWG' | 'BSD' | 'KYD' | 'BMD' 
  | 'FKP' | 'GIP' | 'IMP' | 'JEP' | 'GGP' | 'SHP' | 'TMT' | 'TJS' | 'KGS' | 'UZS' 
  | 'KZT' | 'AZN' | 'GEL' | 'AMD' | 'BYN' | 'MDL' | 'RON' | 'BGN' | 'HRK' | 'RSD' 
  | 'MKD' | 'ALL' | 'MNT' | 'NPR' | 'BDT' | 'LKR' | 'MMK' | 'KHR' | 'LAK' | 'BND' 
  | 'TWD' | 'MOP';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  country: string;
}

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: CurrencyCode;
  convertedAmount: number;
  convertedCurrency: CurrencyCode;
  exchangeRate: number;
  timestamp: number;
}

interface CurrencyContextType {
  // Current currency
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  
  // Currency info
  currencyInfo: CurrencyInfo;
  
  // Conversion functions
  convertPrice: (price: number, fromCurrency?: CurrencyCode) => Promise<number>;
  formatPrice: (price: number, currency?: CurrencyCode) => string;
  
  // Available currencies
  supportedCurrencies: CurrencyInfo[];
  
  // Loading state
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Supported currencies with their symbols and names
const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', country: 'European Union' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', country: 'United Kingdom' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', country: 'Canada' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'Australia' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', country: 'Japan' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', country: 'Switzerland' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', country: 'China' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'India' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', country: 'Brazil' },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', country: 'Mexico' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', country: 'South Korea' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', country: 'Hong Kong' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', country: 'Sweden' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', country: 'Norway' },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', country: 'Denmark' },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Złoty', country: 'Poland' },
  CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', country: 'Czech Republic' },
  HUF: { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', country: 'Hungary' },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', country: 'Russia' },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', country: 'Turkey' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', country: 'South Africa' },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', country: 'Thailand' },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', country: 'Malaysia' },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', country: 'Indonesia' },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', country: 'Philippines' },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', country: 'Vietnam' },
  EGP: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', country: 'Egypt' },
  ILS: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', country: 'Israel' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', country: 'United Arab Emirates' },
  SAR: { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', country: 'Saudi Arabia' },
  QAR: { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal', country: 'Qatar' },
  KWD: { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', country: 'Kuwait' },
  BHD: { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar', country: 'Bahrain' },
  OMR: { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial', country: 'Oman' },
  JOD: { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar', country: 'Jordan' },
  LBP: { code: 'LBP', symbol: 'ل.ل', name: 'Lebanese Pound', country: 'Lebanon' },
  CLP: { code: 'CLP', symbol: '$', name: 'Chilean Peso', country: 'Chile' },
  ARS: { code: 'ARS', symbol: '$', name: 'Argentine Peso', country: 'Argentina' },
  COP: { code: 'COP', symbol: '$', name: 'Colombian Peso', country: 'Colombia' },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', country: 'Peru' },
  UYU: { code: 'UYU', symbol: '$', name: 'Uruguayan Peso', country: 'Uruguay' },
  VES: { code: 'VES', symbol: 'Bs.', name: 'Venezuelan Bolívar', country: 'Venezuela' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', country: 'New Zealand' },
  FJD: { code: 'FJD', symbol: 'FJ$', name: 'Fijian Dollar', country: 'Fiji' },
  XPF: { code: 'XPF', symbol: 'CFP', name: 'CFP Franc', country: 'French Polynesia' },
  WST: { code: 'WST', symbol: 'T', name: 'Samoan Tālā', country: 'Samoa' },
  TOP: { code: 'TOP', symbol: 'T$', name: 'Tongan Paʻanga', country: 'Tonga' },
  SBD: { code: 'SBD', symbol: 'SI$', name: 'Solomon Islands Dollar', country: 'Solomon Islands' },
  VUV: { code: 'VUV', symbol: 'VT', name: 'Vanuatu Vatu', country: 'Vanuatu' },
  PGK: { code: 'PGK', symbol: 'K', name: 'Papua New Guinean Kina', country: 'Papua New Guinea' },
  KID: { code: 'KID', symbol: '$', name: 'Kiribati Dollar', country: 'Kiribati' },
  TVD: { code: 'TVD', symbol: '$', name: 'Tuvaluan Dollar', country: 'Tuvalu' },
  NIO: { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba', country: 'Nicaragua' },
  GTQ: { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal', country: 'Guatemala' },
  HNL: { code: 'HNL', symbol: 'L', name: 'Honduran Lempira', country: 'Honduras' },
  SVC: { code: 'SVC', symbol: '$', name: 'Salvadoran Colón', country: 'El Salvador' },
  BZD: { code: 'BZD', symbol: 'BZ$', name: 'Belize Dollar', country: 'Belize' },
  BBD: { code: 'BBD', symbol: 'Bds$', name: 'Barbadian Dollar', country: 'Barbados' },
  TTD: { code: 'TTD', symbol: 'TT$', name: 'Trinidad and Tobago Dollar', country: 'Trinidad and Tobago' },
  JMD: { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar', country: 'Jamaica' },
  HTG: { code: 'HTG', symbol: 'G', name: 'Haitian Gourde', country: 'Haiti' },
  DOP: { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso', country: 'Dominican Republic' },
  BOB: { code: 'BOB', symbol: 'Bs.', name: 'Bolivian Boliviano', country: 'Bolivia' },
  PYG: { code: 'PYG', symbol: '₲', name: 'Paraguayan Guaraní', country: 'Paraguay' },
  GYD: { code: 'GYD', symbol: 'G$', name: 'Guyanese Dollar', country: 'Guyana' },
  SRD: { code: 'SRD', symbol: '$', name: 'Surinamese Dollar', country: 'Suriname' },
  GHS: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', country: 'Ghana' },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', country: 'Nigeria' },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', country: 'Kenya' },
  UGX: { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', country: 'Uganda' },
  TZS: { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', country: 'Tanzania' },
  MWK: { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha', country: 'Malawi' },
  ZMW: { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha', country: 'Zambia' },
  BWP: { code: 'BWP', symbol: 'P', name: 'Botswana Pula', country: 'Botswana' },
  NAM: { code: 'NAM', symbol: 'N$', name: 'Namibian Dollar', country: 'Namibia' },
  LSL: { code: 'LSL', symbol: 'L', name: 'Lesotho Loti', country: 'Lesotho' },
  SZL: { code: 'SZL', symbol: 'L', name: 'Eswatini Lilangeni', country: 'Eswatini' },
  MUR: { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee', country: 'Mauritius' },
  SCR: { code: 'SCR', symbol: '₨', name: 'Seychellois Rupee', country: 'Seychelles' },
  KMF: { code: 'KMF', symbol: 'CF', name: 'Comorian Franc', country: 'Comoros' },
  DJF: { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Franc', country: 'Djibouti' },
  SOS: { code: 'SOS', symbol: 'S', name: 'Somali Shilling', country: 'Somalia' },
  ETB: { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', country: 'Ethiopia' },
  ERN: { code: 'ERN', symbol: 'Nfk', name: 'Eritrean Nakfa', country: 'Eritrea' },
  SDG: { code: 'SDG', symbol: 'ج.س.', name: 'Sudanese Pound', country: 'Sudan' },
  SSP: { code: 'SSP', symbol: 'SSP', name: 'South Sudanese Pound', country: 'South Sudan' },
  MAD: { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham', country: 'Morocco' },
  TND: { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar', country: 'Tunisia' },
  DZD: { code: 'DZD', symbol: 'د.ج', name: 'Algerian Dinar', country: 'Algeria' },
  LYD: { code: 'LYD', symbol: 'ل.د', name: 'Libyan Dinar', country: 'Libya' },
  XOF: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', country: 'West Africa' },
  XAF: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', country: 'Central Africa' },
  XCD: { code: 'XCD', symbol: 'EC$', name: 'East Caribbean Dollar', country: 'East Caribbean' },
  ANG: { code: 'ANG', symbol: 'ƒ', name: 'Netherlands Antillean Guilder', country: 'Netherlands Antilles' },
  AWG: { code: 'AWG', symbol: 'ƒ', name: 'Aruban Florin', country: 'Aruba' },
  BSD: { code: 'BSD', symbol: 'B$', name: 'Bahamian Dollar', country: 'Bahamas' },
  KYD: { code: 'KYD', symbol: 'CI$', name: 'Cayman Islands Dollar', country: 'Cayman Islands' },
  BMD: { code: 'BMD', symbol: 'BD$', name: 'Bermudian Dollar', country: 'Bermuda' },
  FKP: { code: 'FKP', symbol: 'FK£', name: 'Falkland Islands Pound', country: 'Falkland Islands' },
  GIP: { code: 'GIP', symbol: '£', name: 'Gibraltar Pound', country: 'Gibraltar' },
  IMP: { code: 'IMP', symbol: '£', name: 'Manx Pound', country: 'Isle of Man' },
  JEP: { code: 'JEP', symbol: '£', name: 'Jersey Pound', country: 'Jersey' },
  GGP: { code: 'GGP', symbol: '£', name: 'Guernsey Pound', country: 'Guernsey' },
  SHP: { code: 'SHP', symbol: '£', name: 'Saint Helena Pound', country: 'Saint Helena' },
  TMT: { code: 'TMT', symbol: 'T', name: 'Turkmenistan Manat', country: 'Turkmenistan' },
  TJS: { code: 'TJS', symbol: 'ЅМ', name: 'Tajikistani Somoni', country: 'Tajikistan' },
  KGS: { code: 'KGS', symbol: 'с', name: 'Kyrgyzstani Som', country: 'Kyrgyzstan' },
  UZS: { code: 'UZS', symbol: 'so\'m', name: 'Uzbekistani Som', country: 'Uzbekistan' },
  KZT: { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge', country: 'Kazakhstan' },
  AZN: { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat', country: 'Azerbaijan' },
  GEL: { code: 'GEL', symbol: '₾', name: 'Georgian Lari', country: 'Georgia' },
  AMD: { code: 'AMD', symbol: '֏', name: 'Armenian Dram', country: 'Armenia' },
  BYN: { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble', country: 'Belarus' },
  MDL: { code: 'MDL', symbol: 'L', name: 'Moldovan Leu', country: 'Moldova' },
  RON: { code: 'RON', symbol: 'lei', name: 'Romanian Leu', country: 'Romania' },
  BGN: { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', country: 'Bulgaria' },
  HRK: { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna', country: 'Croatia' },
  RSD: { code: 'RSD', symbol: 'дин.', name: 'Serbian Dinar', country: 'Serbia' },
  MKD: { code: 'MKD', symbol: 'ден', name: 'Macedonian Denar', country: 'North Macedonia' },
  ALL: { code: 'ALL', symbol: 'L', name: 'Albanian Lek', country: 'Albania' },
  MNT: { code: 'MNT', symbol: '₮', name: 'Mongolian Tögrög', country: 'Mongolia' },
  NPR: { code: 'NPR', symbol: '₨', name: 'Nepalese Rupee', country: 'Nepal' },
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', country: 'Bangladesh' },
  LKR: { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', country: 'Sri Lanka' },
  MMK: { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat', country: 'Myanmar' },
  KHR: { code: 'KHR', symbol: '៛', name: 'Cambodian Riel', country: 'Cambodia' },
  LAK: { code: 'LAK', symbol: '₭', name: 'Lao Kip', country: 'Laos' },
  BND: { code: 'BND', symbol: 'B$', name: 'Brunei Dollar', country: 'Brunei' },
  TWD: { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar', country: 'Taiwan' },
  MOP: { code: 'MOP', symbol: 'MOP$', name: 'Macanese Pataca', country: 'Macau' },
};

// Default currency
const DEFAULT_CURRENCY: CurrencyCode = 'USD';

// Detect user's preferred currency based on locale
function detectUserCurrency(): CurrencyCode {
  if (typeof navigator === 'undefined') {
    return DEFAULT_CURRENCY;
  }

  const locale = navigator.language || 'en-US';
  const region = locale.split('-')[1] || 'US';
  
  // Map common regions to currencies
  const regionToCurrency: Record<string, CurrencyCode> = {
    'US': 'USD',
    'CA': 'CAD',
    'GB': 'GBP',
    'AU': 'AUD',
    'JP': 'JPY',
    'CN': 'CNY',
    'IN': 'INR',
    'BR': 'BRL',
    'MX': 'MXN',
    'KR': 'KRW',
    'SG': 'SGD',
    'HK': 'HKD',
    'SE': 'SEK',
    'NO': 'NOK',
    'DK': 'DKK',
    'PL': 'PLN',
    'CZ': 'CZK',
    'HU': 'HUF',
    'RU': 'RUB',
    'TR': 'TRY',
    'ZA': 'ZAR',
    'TH': 'THB',
    'MY': 'MYR',
    'ID': 'IDR',
    'PH': 'PHP',
    'VN': 'VND',
    'EG': 'EGP',
    'IL': 'ILS',
    'AE': 'AED',
    'SA': 'SAR',
    'QA': 'QAR',
    'KW': 'KWD',
    'BH': 'BHD',
    'OM': 'OMR',
    'JO': 'JOD',
    'LB': 'LBP',
    'CL': 'CLP',
    'AR': 'ARS',
    'CO': 'COP',
    'PE': 'PEN',
    'UY': 'UYU',
    'VE': 'VES',
    'NZ': 'NZD',
    'FJ': 'FJD',
    'PF': 'XPF',
    'WS': 'WST',
    'TO': 'TOP',
    'SB': 'SBD',
    'VU': 'VUV',
    'PG': 'PGK',
    'KI': 'KID',
    'TV': 'TVD',
    'NI': 'NIO',
    'GT': 'GTQ',
    'HN': 'HNL',
    'SV': 'SVC',
    'BZ': 'BZD',
    'BB': 'BBD',
    'TT': 'TTD',
    'JM': 'JMD',
    'HT': 'HTG',
    'DO': 'DOP',
    'BO': 'BOB',
    'PY': 'PYG',
    'GY': 'GYD',
    'SR': 'SRD',
    'GH': 'GHS',
    'NG': 'NGN',
    'KE': 'KES',
    'UG': 'UGX',
    'TZ': 'TZS',
    'MW': 'MWK',
    'ZM': 'ZMW',
    'BW': 'BWP',
    'NA': 'NAM',
    'LS': 'LSL',
    'SZ': 'SZL',
    'MU': 'MUR',
    'SC': 'SCR',
    'KM': 'KMF',
    'DJ': 'DJF',
    'SO': 'SOS',
    'ET': 'ETB',
    'ER': 'ERN',
    'SD': 'SDG',
    'SS': 'SSP',
    'MA': 'MAD',
    'TN': 'TND',
    'DZ': 'DZD',
    'LY': 'LYD',
    'BF': 'XOF',
    'CM': 'XAF',
    'AG': 'XCD',
    'NC': 'XPF',
    'AN': 'ANG',
    'AW': 'AWG',
    'BS': 'BSD',
    'KY': 'KYD',
    'BM': 'BMD',
    'FK': 'FKP',
    'GI': 'GIP',
    'IM': 'IMP',
    'JE': 'JEP',
    'GG': 'GGP',
    'SH': 'SHP',
    'TM': 'TMT',
    'TJ': 'TJS',
    'KG': 'KGS',
    'UZ': 'UZS',
    'KZ': 'KZT',
    'AZ': 'AZN',
    'GE': 'GEL',
    'AM': 'AMD',
    'BY': 'BYN',
    'MD': 'MDL',
    'RO': 'RON',
    'BG': 'BGN',
    'HR': 'HRK',
    'RS': 'RSD',
    'MK': 'MKD',
    'AL': 'ALL',
    'MN': 'MNT',
    'NP': 'NPR',
    'BD': 'BDT',
    'LK': 'LKR',
    'MM': 'MMK',
    'KH': 'KHR',
    'LA': 'LAK',
    'BN': 'BND',
    'TW': 'TWD',
    'MO': 'MOP',
    // Add European countries
    'ES': 'EUR',
    'FR': 'EUR',
    'DE': 'EUR',
    'IT': 'EUR',
    'NL': 'EUR',
    'BE': 'EUR',
    'AT': 'EUR',
    'PT': 'EUR',
    'IE': 'EUR',
    'FI': 'EUR',
    'GR': 'EUR',
    'SI': 'EUR',
    'SK': 'EUR',
    'EE': 'EUR',
    'LV': 'EUR',
    'LT': 'EUR',
    'LU': 'EUR',
    'MT': 'EUR',
    'CY': 'EUR',
  };

  return regionToCurrency[region] || DEFAULT_CURRENCY;
}

// Format currency amount with proper symbol and formatting
function formatCurrency(amount: number, currency: CurrencyCode): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency];
  const symbol = currencyInfo.symbol;
  
  // Handle special formatting for different currencies
  switch (currency) {
    case 'JPY':
    case 'KRW':
    case 'VND':
    case 'IDR':
      // No decimal places for these currencies
      return `${symbol}${Math.round(amount).toLocaleString()}`;
    
    case 'BHD':
    case 'KWD':
    case 'OMR':
    case 'JOD':
      // 3 decimal places for these currencies
      return `${symbol}${amount.toFixed(3)}`;
    
    default:
      // Standard 2 decimal places
      return `${symbol}${amount.toFixed(2)}`;
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [loading, setLoading] = useState(true);

  // Load saved currency preference on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('labubu_currency') as CurrencyCode;
    if (savedCurrency && savedCurrency in SUPPORTED_CURRENCIES) {
      setCurrencyState(savedCurrency);
    } else {
      // Auto-detect currency based on user's locale
      const detectedCurrency = detectUserCurrency();
      setCurrencyState(detectedCurrency);
      localStorage.setItem('labubu_currency', detectedCurrency);
    }
    setLoading(false);
  }, []);

  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('labubu_currency', newCurrency);
  };

  const convertPrice = async (price: number, fromCurrency: CurrencyCode = 'USD'): Promise<number> => {
    if (fromCurrency === currency) {
      return price;
    }

    try {
      const response = await fetch('/api/currency/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: price,
          fromCurrency,
          toCurrency: currency,
        }),
      });

      if (!response.ok) {
        console.error('Currency conversion failed');
        return price; // Fallback to original price
      }

      const result = await response.json();
      return result.convertedAmount;
    } catch (error) {
      console.error('Currency conversion error:', error);
      return price; // Fallback to original price
    }
  };

  const formatPrice = (price: number, currencyCode?: CurrencyCode): string => {
    const targetCurrency = currencyCode || currency;
    return formatCurrency(price, targetCurrency);
  };

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    currencyInfo: SUPPORTED_CURRENCIES[currency],
    convertPrice,
    formatPrice,
    supportedCurrencies: Object.values(SUPPORTED_CURRENCIES),
    loading,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
} 