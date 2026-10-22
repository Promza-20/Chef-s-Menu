export type Course =
  | 'Starter'
  | 'Main Course'
  | 'Sides'
  | 'Dessert'
  | 'Drinks';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  course: Course;
  price: number;
  imageUri?: string;
};

export type OrderStatus = 'New' | 'Preparing' | 'Ready' | 'Completed';

export type Order = {
  id: string;
  customerName: string;
  note: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
  total: number;
  status: OrderStatus;
  createdAt: string;
};