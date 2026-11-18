import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import {
  Bill,
  PaymentRequest,
  PaymentResponse,
} from '../models/billing.model';
import { AuthService } from '../../core/auth/auth.service';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly baseUrl = '/api/v1';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getMyBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.baseUrl}/bills/me`);
  }

  createPayment(
    billId: string,
    request: PaymentRequest,
  ): Observable<PaymentResponse> {
    return this.authService
      .ensureCsrfToken()
      .pipe(
        switchMap(() =>
          this.http.post<PaymentResponse>(
            `${this.baseUrl}/payments/me/${billId}`,
            request,
          ),
        ),
      );
  }
}
