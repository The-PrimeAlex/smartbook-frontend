import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';


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
    return this.http.patch<{ message: string }>(
      `${this.baseUrl}/${requestId}/approve`,
      {},
    );
  }

  rejectRequest(
    requestId: string,
  ): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.baseUrl}/${requestId}/reject`,
      {},
    );
  }
}
