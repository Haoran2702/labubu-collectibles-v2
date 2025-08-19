import cache from '../cache';

// Supported currencies with their symbols and names
export const SUPPORTED_CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', country: 'United States' },
  EUR: { symbol: '€', name: 'Euro', country: 'European Union' },
  GBP: { symbol: '£', name: 'British Pound', country: 'United Kingdom' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', country: 'Canada' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', country: 'Australia' },
  JPY: { symbol: '¥', name: 'Japanese Yen', country: 'Japan' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', country: 'Switzerland' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', country: 'China' },
  INR: { symbol: '₹', name: 'Indian Rupee', country: 'India' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', country: 'Brazil' },
  MXN: { symbol: '$', name: 'Mexican Peso', country: 'Mexico' },
  KRW: { symbol: '₩', name: 'South Korean Won', country: 'South Korea' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', country: 'Hong Kong' },
  SEK: { symbol: 'kr', name: 'Swedish Krona', country: 'Sweden' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', country: 'Norway' },
  DKK: { symbol: 'kr', name: 'Danish Krone', country: 'Denmark' },
  PLN: { symbol: 'zł', name: 'Polish Złoty', country: 'Poland' },
  CZK: { symbol: 'Kč', name: 'Czech Koruna', country: 'Czech Republic' },
  HUF: { symbol: 'Ft', name: 'Hungarian Forint', country: 'Hungary' },
  RUB: { symbol: '₽', name: 'Russian Ruble', country: 'Russia' },
  TRY: { symbol: '₺', name: 'Turkish Lira', country: 'Turkey' },
  ZAR: { symbol: 'R', name: 'South African Rand', country: 'South Africa' },
  THB: { symbol: '฿', name: 'Thai Baht', country: 'Thailand' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', country: 'Malaysia' },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', country: 'Indonesia' },
  PHP: { symbol: '₱', name: 'Philippine Peso', country: 'Philippines' },
  VND: { symbol: '₫', name: 'Vietnamese Dong', country: 'Vietnam' },
  EGP: { symbol: 'E£', name: 'Egyptian Pound', country: 'Egypt' },
  ILS: { symbol: '₪', name: 'Israeli Shekel', country: 'Israel' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', country: 'United Arab Emirates' },
  SAR: { symbol: 'ر.س', name: 'Saudi Riyal', country: 'Saudi Arabia' },
  QAR: { symbol: 'ر.ق', name: 'Qatari Riyal', country: 'Qatar' },
  KWD: { symbol: 'د.ك', name: 'Kuwaiti Dinar', country: 'Kuwait' },
  BHD: { symbol: '.د.ب', name: 'Bahraini Dinar', country: 'Bahrain' },
  OMR: { symbol: 'ر.ع.', name: 'Omani Rial', country: 'Oman' },
  JOD: { symbol: 'د.ا', name: 'Jordanian Dinar', country: 'Jordan' },
  LBP: { symbol: 'ل.ل', name: 'Lebanese Pound', country: 'Lebanon' },
  CLP: { symbol: '$', name: 'Chilean Peso', country: 'Chile' },
  ARS: { symbol: '$', name: 'Argentine Peso', country: 'Argentina' },
  COP: { symbol: '$', name: 'Colombian Peso', country: 'Colombia' },
  PEN: { symbol: 'S/', name: 'Peruvian Sol', country: 'Peru' },
  UYU: { symbol: '$', name: 'Uruguayan Peso', country: 'Uruguay' },
  VES: { symbol: 'Bs.', name: 'Venezuelan Bolívar', country: 'Venezuela' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', country: 'New Zealand' },
  FJD: { symbol: 'FJ$', name: 'Fijian Dollar', country: 'Fiji' },
  XPF: { symbol: 'CFP', name: 'CFP Franc', country: 'French Polynesia' },
  WST: { symbol: 'T', name: 'Samoan Tālā', country: 'Samoa' },
  TOP: { symbol: 'T$', name: 'Tongan Paʻanga', country: 'Tonga' },
  SBD: { symbol: 'SI$', name: 'Solomon Islands Dollar', country: 'Solomon Islands' },
  VUV: { symbol: 'VT', name: 'Vanuatu Vatu', country: 'Vanuatu' },
  PGK: { symbol: 'K', name: 'Papua New Guinean Kina', country: 'Papua New Guinea' },
  KID: { symbol: '$', name: 'Kiribati Dollar', country: 'Kiribati' },
  TVD: { symbol: '$', name: 'Tuvaluan Dollar', country: 'Tuvalu' },
  NIO: { symbol: 'C$', name: 'Nicaraguan Córdoba', country: 'Nicaragua' },
  GTQ: { symbol: 'Q', name: 'Guatemalan Quetzal', country: 'Guatemala' },
  HNL: { symbol: 'L', name: 'Honduran Lempira', country: 'Honduras' },
  SVC: { symbol: '$', name: 'Salvadoran Colón', country: 'El Salvador' },
  BZD: { symbol: 'BZ$', name: 'Belize Dollar', country: 'Belize' },
  BBD: { symbol: 'Bds$', name: 'Barbadian Dollar', country: 'Barbados' },
  TTD: { symbol: 'TT$', name: 'Trinidad and Tobago Dollar', country: 'Trinidad and Tobago' },
  JMD: { symbol: 'J$', name: 'Jamaican Dollar', country: 'Jamaica' },
  HTG: { symbol: 'G', name: 'Haitian Gourde', country: 'Haiti' },
  DOP: { symbol: 'RD$', name: 'Dominican Peso', country: 'Dominican Republic' },
  BOB: { symbol: 'Bs.', name: 'Bolivian Boliviano', country: 'Bolivia' },
  PYG: { symbol: '₲', name: 'Paraguayan Guaraní', country: 'Paraguay' },
  GYD: { symbol: 'G$', name: 'Guyanese Dollar', country: 'Guyana' },
  SRD: { symbol: '$', name: 'Surinamese Dollar', country: 'Suriname' },
  GHS: { symbol: 'GH₵', name: 'Ghanaian Cedi', country: 'Ghana' },
  NGN: { symbol: '₦', name: 'Nigerian Naira', country: 'Nigeria' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling', country: 'Kenya' },
  UGX: { symbol: 'USh', name: 'Ugandan Shilling', country: 'Uganda' },
  TZS: { symbol: 'TSh', name: 'Tanzanian Shilling', country: 'Tanzania' },
  MWK: { symbol: 'MK', name: 'Malawian Kwacha', country: 'Malawi' },
  ZMW: { symbol: 'ZK', name: 'Zambian Kwacha', country: 'Zambia' },
  BWP: { symbol: 'P', name: 'Botswana Pula', country: 'Botswana' },
  NAM: { symbol: 'N$', name: 'Namibian Dollar', country: 'Namibia' },
  LSL: { symbol: 'L', name: 'Lesotho Loti', country: 'Lesotho' },
  SZL: { symbol: 'L', name: 'Eswatini Lilangeni', country: 'Eswatini' },
  MUR: { symbol: '₨', name: 'Mauritian Rupee', country: 'Mauritius' },
  SCR: { symbol: '₨', name: 'Seychellois Rupee', country: 'Seychelles' },
  KMF: { symbol: 'CF', name: 'Comorian Franc', country: 'Comoros' },
  DJF: { symbol: 'Fdj', name: 'Djiboutian Franc', country: 'Djibouti' },
  SOS: { symbol: 'S', name: 'Somali Shilling', country: 'Somalia' },
  ETB: { symbol: 'Br', name: 'Ethiopian Birr', country: 'Ethiopia' },
  ERN: { symbol: 'Nfk', name: 'Eritrean Nakfa', country: 'Eritrea' },
  SDG: { symbol: 'ج.س.', name: 'Sudanese Pound', country: 'Sudan' },
  SSP: { symbol: 'SSP', name: 'South Sudanese Pound', country: 'South Sudan' },
  MAD: { symbol: 'د.م.', name: 'Moroccan Dirham', country: 'Morocco' },
  TND: { symbol: 'د.ت', name: 'Tunisian Dinar', country: 'Tunisia' },
  DZD: { symbol: 'د.ج', name: 'Algerian Dinar', country: 'Algeria' },
  LYD: { symbol: 'ل.د', name: 'Libyan Dinar', country: 'Libya' },
  XOF: { symbol: 'CFA', name: 'West African CFA Franc', country: 'West Africa' },
  XAF: { symbol: 'FCFA', name: 'Central African CFA Franc', country: 'Central Africa' },
  XCD: { symbol: 'EC$', name: 'East Caribbean Dollar', country: 'East Caribbean' },
  ANG: { symbol: 'ƒ', name: 'Netherlands Antillean Guilder', country: 'Netherlands Antilles' },
  AWG: { symbol: 'ƒ', name: 'Aruban Florin', country: 'Aruba' },
  BSD: { symbol: 'B$', name: 'Bahamian Dollar', country: 'Bahamas' },
  KYD: { symbol: 'CI$', name: 'Cayman Islands Dollar', country: 'Cayman Islands' },
  BMD: { symbol: 'BD$', name: 'Bermudian Dollar', country: 'Bermuda' },
  FKP: { symbol: 'FK£', name: 'Falkland Islands Pound', country: 'Falkland Islands' },
  GIP: { symbol: '£', name: 'Gibraltar Pound', country: 'Gibraltar' },
  IMP: { symbol: '£', name: 'Manx Pound', country: 'Isle of Man' },
  JEP: { symbol: '£', name: 'Jersey Pound', country: 'Jersey' },
  GGP: { symbol: '£', name: 'Guernsey Pound', country: 'Guernsey' },
  SHP: { symbol: '£', name: 'Saint Helena Pound', country: 'Saint Helena' },
  TMT: { symbol: 'T', name: 'Turkmenistan Manat', country: 'Turkmenistan' },
  TJS: { symbol: 'ЅМ', name: 'Tajikistani Somoni', country: 'Tajikistan' },
  KGS: { symbol: 'с', name: 'Kyrgyzstani Som', country: 'Kyrgyzstan' },
  UZS: { symbol: 'so\'m', name: 'Uzbekistani Som', country: 'Uzbekistan' },
  KZT: { symbol: '₸', name: 'Kazakhstani Tenge', country: 'Kazakhstan' },
  AZN: { symbol: '₼', name: 'Azerbaijani Manat', country: 'Azerbaijan' },
  GEL: { symbol: '₾', name: 'Georgian Lari', country: 'Georgia' },
  AMD: { symbol: '֏', name: 'Armenian Dram', country: 'Armenia' },
  BYN: { symbol: 'Br', name: 'Belarusian Ruble', country: 'Belarus' },
  MDL: { symbol: 'L', name: 'Moldovan Leu', country: 'Moldova' },
  RON: { symbol: 'lei', name: 'Romanian Leu', country: 'Romania' },
  BGN: { symbol: 'лв', name: 'Bulgarian Lev', country: 'Bulgaria' },
  HRK: { symbol: 'kn', name: 'Croatian Kuna', country: 'Croatia' },
  RSD: { symbol: 'дин.', name: 'Serbian Dinar', country: 'Serbia' },
  MKD: { symbol: 'ден', name: 'Macedonian Denar', country: 'North Macedonia' },
  ALL: { symbol: 'L', name: 'Albanian Lek', country: 'Albania' },
  MNT: { symbol: '₮', name: 'Mongolian Tögrög', country: 'Mongolia' },
  NPR: { symbol: '₨', name: 'Nepalese Rupee', country: 'Nepal' },
  BDT: { symbol: '৳', name: 'Bangladeshi Taka', country: 'Bangladesh' },
  LKR: { symbol: 'Rs', name: 'Sri Lankan Rupee', country: 'Sri Lanka' },
  MMK: { symbol: 'K', name: 'Myanmar Kyat', country: 'Myanmar' },
  KHR: { symbol: '៛', name: 'Cambodian Riel', country: 'Cambodia' },
  LAK: { symbol: '₭', name: 'Lao Kip', country: 'Laos' },
  BND: { symbol: 'B$', name: 'Brunei Dollar', country: 'Brunei' },
  TWD: { symbol: 'NT$', name: 'New Taiwan Dollar', country: 'Taiwan' },
  MOP: { symbol: 'MOP$', name: 'Macanese Pataca', country: 'Macau' },
} as const;

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

// Default currency
export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

// Cache duration for exchange rates (1 hour)
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface ExchangeRateResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface ConversionResult {
  originalAmount: number;
  originalCurrency: CurrencyCode;
  convertedAmount: number;
  convertedCurrency: CurrencyCode;
  exchangeRate: number;
  timestamp: number;
}

// Get exchange rates from API
async function fetchExchangeRates(baseCurrency: CurrencyCode = 'USD'): Promise<Record<string, number>> {
  const cacheKey = `exchange_rates_${baseCurrency}`;
  const cached = cache.get(cacheKey) as { rates: Record<string, number>; timestamp: number } | undefined;
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rates;
  }

  try {
    // Using exchangerate-api.com (free tier)
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.status}`);
    }

    const data: ExchangeRateResponse = await response.json();
    
    if (!data.success && !data.rates) {
      throw new Error('Invalid response from exchange rate API');
    }

    // Cache the rates
    cache.set(cacheKey, {
      rates: data.rates,
      timestamp: Date.now()
    });

    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Return cached data even if expired, or fallback to 1:1 rates
    if (cached) {
      return cached.rates;
    }
    
    // Fallback: return 1:1 rates for all currencies
    const fallbackRates: Record<string, number> = {};
    Object.keys(SUPPORTED_CURRENCIES).forEach(currency => {
      fallbackRates[currency] = currency === baseCurrency ? 1 : 1;
    });
    
    return fallbackRates;
  }
}

// Convert amount from one currency to another
export async function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<ConversionResult> {
  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: amount,
      convertedCurrency: toCurrency,
      exchangeRate: 1,
      timestamp: Date.now()
    };
  }

  const rates = await fetchExchangeRates(fromCurrency);
  const rate = rates[toCurrency] || 1;
  const convertedAmount = amount * rate;

  return {
    originalAmount: amount,
    originalCurrency: fromCurrency,
    convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
    convertedCurrency: toCurrency,
    exchangeRate: rate,
    timestamp: Date.now()
  };
}

// Convert multiple amounts at once
export async function convertMultipleCurrencies(
  amounts: Array<{ amount: number; currency: CurrencyCode }>,
  toCurrency: CurrencyCode
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = [];
  
  for (const { amount, currency } of amounts) {
    const result = await convertCurrency(amount, currency, toCurrency);
    results.push(result);
  }
  
  return results;
}

// Format currency amount with proper symbol and formatting
export function formatCurrency(amount: number, currency: CurrencyCode): string {
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

// Get currency info
export function getCurrencyInfo(currency: CurrencyCode) {
  return SUPPORTED_CURRENCIES[currency];
}

// Get all supported currencies
export function getSupportedCurrencies() {
  return Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => ({
    code,
    ...info
  }));
}

// Detect user's preferred currency based on locale
export function detectUserCurrency(): CurrencyCode {
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
    'EU': 'EUR',
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
  };

  return regionToCurrency[region] || DEFAULT_CURRENCY;
}

// Validate currency code
export function isValidCurrency(currency: string): currency is CurrencyCode {
  return currency in SUPPORTED_CURRENCIES;
} 