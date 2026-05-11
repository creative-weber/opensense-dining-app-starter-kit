export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isVegetarian: boolean;
  isVegan: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface RestaurantInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  address: string | null;
}

export interface TableInfo {
  id: string;
  table_number: string;
  capacity: number;
}

export interface MenuResponse {
  restaurant: RestaurantInfo;
  table: TableInfo | null;
  categories: MenuCategory[];
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface OrderItemResponse {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string | null;
}

export interface OrderResponse {
  id: string;
  status: string;
  customerName: string;
  tableNumber: string | null;
  subtotal: number;
  createdAt: string;
  items: OrderItemResponse[];
}
