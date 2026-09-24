export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  currency: string;
  imageUrl?: string;
};

export type OrderSubmission = {
  name: string;
  email: string;
  address: string;
  items: OrderItem[];
  totalPrice: number;
  currency: string;
};

export type AdminOrder = OrderSubmission & {
  id: string;
  createdAt: string;
  paymentStatus: string;
};
