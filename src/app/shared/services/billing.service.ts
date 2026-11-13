import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Bill,
  PaymentRequest,
  PaymentResponse,
  PaymentStatusResponse,
} from '../models/billing.model';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly baseUrl = '/api/v1';

  constructor(private http: HttpClient) {}

  getMyBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(
      `${this.baseUrl}/bills/me`,
    );
  }

  createPayment(
    billId: string,
    request: PaymentRequest,
  ): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(
      `${this.baseUrl}/payments/me/${billId}`,
      request,
    );
  }

  queryMpesaPaymentStatus(
    checkoutRequestId: string,
  ): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(
      `${this.baseUrl}/payments/me/mpesa/status`,
      {
        params: { checkoutRequestId },
      },
    );
  }
}
