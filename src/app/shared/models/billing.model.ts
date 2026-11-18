export interface BillItem {
  itemType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Payment {
  paymentId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  paidAt: string | null;
}

export interface BookingInfo {
  bookingId: string;
  roomName: string;
  purpose: string;
  startTime: string;
  endTime: string;
}

export interface Bill {
  billId: string;
  invoiceNumber: string | null;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  billStatus: string;
  issuedAt: string;
  dueAt: string;
  booking: BookingInfo | null;
  items: BillItem[];
  payments: Payment[];
  amountPaid: number;
}

export interface PaymentRequest {
  paymentMethod: string;
  amount: number;
  transactionReference: string;
}

export interface PaymentResponse {
  paymentId: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionReference: string;
  paidAt: string | null;
}
