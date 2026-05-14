export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
  is_archived: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  category_name: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_available: boolean;
}

export interface TableRow {
  id: string;
  table_number: string;
  capacity: number;
}

export interface QRData {
  tableId: string;
  tableNumber: string;
  menuUrl: string;
  qrDataUrl: string;
  restaurantName: string;
  restaurantSlug: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string | null;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  subtotal: number;
  tax: number;
  payment_status: string;
  whatsapp_sent: boolean;
  notes: string | null;
  created_at: string;
  table_number: string | null;
  items?: OrderItem[];
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface OpenHours {
  mon: DayHours; tue: DayHours; wed: DayHours; thu: DayHours;
  fri: DayHours; sat: DayHours; sun: DayHours;
}

export interface RestaurantSettings {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  brand_color: string;
  kds_pin: string | null;
  open_hours: OpenHours | null;
  daily_summary_enabled: boolean;
}
