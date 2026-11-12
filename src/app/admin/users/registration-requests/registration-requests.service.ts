import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';


export interface RegistrationRequest {
  requestId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  registrationNumber: string | null;
  contactEmail: string;
  status: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class RegistrationRequestsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl =
    `${environment.apiUrl}/registration-requests/admin`;

  getRequests(
    status?: string,
  ): Observable<RegistrationRequest[]> {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    return this.http
      .get<RegistrationRequest[]>(this.baseUrl, { params })
      .pipe(catchError(() => of([])));
  }

  approveRequest(
    requestId: string,
  ): Observable<{ message: string }> {
    return this.authService.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http.patch<{ message: string }>(
          `${this.baseUrl}/${requestId}/approve`,
          {},
        ),
      ),
    );
  }

  rejectRequest(
    requestId: string,
  ): Observable<{ message: string }> {
    return this.authService.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http.patch<{ message: string }>(
          `${this.baseUrl}/${requestId}/reject`,
          {},
        ),
      ),
    );
  }
}
