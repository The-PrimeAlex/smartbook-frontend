import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


export interface AdminBill {
  billId: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  billStatus: string;
  issuedAt: string;
  dueAt: string;
  booking: AdminBookingInfo;
  items: AdminBillItem[];
  payments: AdminPayment[];
  amountPaid: number;
}

export interface AdminBookingInfo {
  bookingId: string;
  roomName: string;
  purpose: string;
  startTime: string;
  endTime: string;
  userName: string;
}

export interface AdminBillItem {
  itemType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface AdminPayment {
  paymentId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  paidAt: string | null;
}

export interface AdminPaymentRecord {
  paymentId: string;
  billId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionReference: string;
  paidAt: string | null;
  createdAt: string;
  roomName: string;
  userName: string;
}

export interface AdminUsageRecord {
  usageId: string;
  roomName: string;
  userName: string;
  purpose: string;
  checkInTime: string;
  checkOutTime: string | null;
  actualDurationMinutes: number | null;
  overrunMinutes: number | null;
  autoClosed: boolean | null;
  roomCharge: number;
  overrunCharge: number;
  totalCharge: number;
}

@Injectable({ providedIn: 'root' })
export class AdminBillingService {
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getAllBills(): Observable<AdminBill[]> {
    return this.http.get<AdminBill[]>(
      `${this.baseUrl}/bills`,
    );
  }

  getAllPayments(): Observable<AdminPaymentRecord[]> {
    return this.http.get<AdminPaymentRecord[]>(
      `${this.baseUrl}/payments`,
    );
  }

  getAllUsage(): Observable<AdminUsageRecord[]> {
    return this.http.get<AdminUsageRecord[]>(
      `${this.baseUrl}/usage`,
    );
  }
}
