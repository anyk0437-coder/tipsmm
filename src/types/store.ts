export type CategoryId =
  | 'all'
  | 'leather-carry'
  | 'ceramics-home'
  | 'textiles-apparel'
  | 'brass-objects'
  | 'apothecary'
  | 'footwear';

export type PaymentGatewayId = 'gopayfast' | 'nayapay' | 'easypaisa' | 'binance';

export interface ProductVariant {
  label: string;
  options: string[];
}

export interface Product {
  id: string;
  lotNumber: string;
  title: string;
  urduTitle?: string;
  subtitle: string;
  category: Exclude<CategoryId, 'all'>;
  categoryLabel: string;
  pricePkr: number;
  originalPricePkr?: number;
  originCity: string;
  artisanName: string;
  craftingHours: number;
  batchSize: string;
  materials: string[];
  dimensions: string;
  weight: string;
  image: string;
  description: string;
  makerNote: string;
  variants?: ProductVariant;
  inStock: number;
  featuredSpan?: 'wide' | 'tall' | 'standard';
  badge?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOption: string;
  customEngraving?: string;
}

export interface CustomerDetails {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  orderNotes?: string;
}

export interface OrderPaymentDetails {
  gateway: PaymentGatewayId;
  gatewayLabel: string;
  recipientAccount: string;
  recipientName: string;
  senderPhoneOrId?: string;
  transactionId: string;
  amountPkr: number;
  amountUsdt: number;
  gopayfastMethod?: 'card' | 'raast' | 'bank';
  gopayfastAuthCode?: string;
  binanceCoin?: 'USDT' | 'USDC' | 'BNB';
  screenshotDataUrl?: string;
  screenshotName?: string;
}

export interface OrderRecord {
  id: string;
  createdAt: string;
  items: CartItem[];
  subtotalPkr: number;
  shippingPkr: number;
  totalPkr: number;
  totalUsdt: number;
  customer: CustomerDetails;
  payment: OrderPaymentDetails;
  status: 'Payment Submitted — Under Verification' | 'Verified & In Dispatch';
}
