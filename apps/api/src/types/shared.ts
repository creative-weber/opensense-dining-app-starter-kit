export interface OrderItemRecord {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface OrderRecord {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  customer_name: string;
  customer_phone: string;
  status: string;
  notes: string | null;
  subtotal: number;
  tax: number;
  payment_status: string;
  whatsapp_sent: boolean;
  created_at: string;
  table_number?: string | null;
  items?: OrderItemRecord[];
}

export interface DayHours {
  open: string;   // 'HH:MM'
  close: string;  // 'HH:MM'
  closed: boolean;
}

export interface OpenHours {
  mon: DayHours; tue: DayHours; wed: DayHours; thu: DayHours;
  fri: DayHours; sat: DayHours; sun: DayHours;
}

export interface RestaurantRow {
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

export interface TableRow {
  id: string;
  restaurant_id: string;
  table_number: string;
  capacity: number;
}

export interface MenuItemRow {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_available: boolean;
  sort_order: number;
}

export interface MenuCategoryRow {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  is_archived: boolean;
}
