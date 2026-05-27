export interface Product {
  id: string;
  name: string;
  price: number | string;
  image: string; // Featured image
  images?: string[]; // Multiple photos
  category: string;
  description: string;
  anime: string;
  isFeatured?: boolean;
  isComingSoon?: boolean;
  color?: string; // Legacy/Single color label
  colors?: string[]; // Multiple color options
  outOfStockColors?: string[];
  outOfStockImages?: string[];
  videoUrl?: string;
  discountPrice?: number | string;
  originalPrice?: number | string;
}

export interface Category {
  id: string;
  name: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
}

export interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    district: string;
    thana: string;
    address: string;
  };
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: string;
  transactionInfo?: string;
  status:
    | "Processing"
    | "Shipped"
    | "Out for Delivery"
    | "Delivered"
    | "Cancelled";
  date: string;
  promoCode?: string;
  promoDiscount?: number;
}

export interface PromoCode {
  id: string;
  code: string;
  type: "percentage" | "fixed_amount";
  value: number;
  minPurchase?: number;
  deliveryOption: "none" | "dhaka" | "outside" | "all";
  status: "active" | "inactive";
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "ai" | "admin";
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userName: string;
  userEmail: string;
  messages: ChatMessage[];
  lastMessageAt: string;
  status: "active" | "closed";
}

export interface OrderStatus {
  id: string;
  status: "Processing" | "Shipped" | "Out for Delivery" | "Delivered";
  date: string;
  location: string;
}
