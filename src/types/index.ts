export interface ProductVariation {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  stock: number;
  active: boolean;
  sku?: string;
}

export interface CustomField {
  id: string;
  label: string;
  placeholder?: string;
  required: boolean;
  type?: 'text' | 'number' | 'email';
  helpText?: string;
}

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  description: string;
  instructions?: string;
  imageUrl: string;
  bannerUrl?: string;
  basePrice: number;
  oldPrice?: number;
  stock: number;
  isFeatured: boolean;
  isPopular: boolean;
  isActive: boolean;
  customFields: CustomField[];
  variations: ProductVariation[];
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface Category {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  icon: string;
  description: string;
  isActive: boolean;
  order: number;
}

export interface CartItem {
  id: string; // unique item id: productId + variationId + JSON.stringify(customFieldValues)
  productId: string;
  productName: string;
  subtitle?: string;
  variationId: string;
  variationName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  customFieldValues: Record<string, string>;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled'
  | 'Refunded';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export type PaymentMethod = 'bKash' | 'Nagad' | 'Rocket' | 'SSBD Wallet';

export interface Order {
  id: string; // e.g. SSBD-89210
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerNotes?: string;
  userId?: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  senderNumber?: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  digitalDeliveryNotes?: string;
  adminNotes?: string;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface SiteSettings {
  storeName: string;
  logoUrl?: string;
  tagline?: string;
  currencySymbol?: string;
  minDepositAmount?: number;
  announcementEnabled?: boolean;
  announcement: string;
  announcementBadge?: string;
  announcementLink?: string;
  heroBadge: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  heroCta1Text?: string;
  heroCta1Link?: string;
  heroCta2Text?: string;
  heroCta2Link?: string;
  heroCta3Text?: string;
  heroCta3Link?: string;
  popularSectionTitle?: string;
  popularSectionSubtitle?: string;
  giftCardSectionTitle?: string;
  giftCardSectionSubtitle?: string;
  trustBadge1?: string;
  trustBadge2?: string;
  trustBadge3?: string;
  bkashNumber: string;
  bkashType: string;
  bkashHelpNote?: string;
  nagadNumber: string;
  nagadType: string;
  nagadHelpNote?: string;
  rocketNumber: string;
  rocketType: string;
  rocketHelpNote?: string;
  securityBadgeNote?: string;
  paymentInstructions: string;
  supportPhone: string;
  supportEmail: string;
  supportWhatsapp: string;
  supportTelegram?: string;
  supportHours?: string;
  supportNotice?: string;
  facebookPageUrl?: string;
  youtubeChannelUrl?: string;
  discordCommunityUrl?: string;
  footerText: string;
  copyrightText?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  walletBalance: number;
  role: 'admin' | 'customer';
  status?: 'Active' | 'Suspended';
  createdAt?: string | number;
  updatedAt?: string | number;
}

export type DepositStatus = 'Pending' | 'Approved' | 'Rejected';

export interface DepositRequest {
  id: string; // e.g. DEP-74892
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Cellfin' | 'Upay';
  targetNumber: string; // The official number they sent to
  senderNumber: string; // The customer's sender phone
  transactionId: string; // TrxID
  screenshotUrl?: string; // Base64 or image URL of payment confirmation
  userNote?: string;
  adminNote?: string;
  status: DepositStatus;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  processedBy?: string;
}

export type WalletTxType = 'CREDIT_DEPOSIT' | 'DEBIT_PURCHASE' | 'ADMIN_ADD' | 'ADMIN_DEDUCT' | 'REFUND';

export interface WalletTransaction {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  type: WalletTxType;
  amount: number;
  previousBalance: number;
  newBalance: number;
  referenceId?: string; // Order ID or Deposit ID
  method?: string;
  trxId?: string;
  adminEmail?: string;
  reason?: string;
  description: string;
  createdAt: string;
}


