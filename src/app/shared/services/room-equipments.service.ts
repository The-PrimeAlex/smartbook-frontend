import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { RoomEquipment } from '../models/room.model';
import { environment } from '../../../environments/environment';


interface CsrfTokenResponse {
  token: string;
  headerName: string;
}

@Injectable({ providedIn: 'root' })
export class RoomEquipmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/rooms`;

  private loadCsrfToken(): Observable<CsrfTokenResponse> {
    return this.http.get<CsrfTokenResponse>(
      `${environment.apiUrl}/auth/csrf`,
      {
        withCredentials: true,
      },
    );
  }

  addEquipment(
    roomId: string,
    equipment: RoomEquipment,
  ): Observable<RoomEquipment[]> {
    return this.http.post<RoomEquipment[]>(
      `${this.apiUrl}/${encodeURIComponent(roomId)}/equipment`,
      [equipment],
    );
  }

  removeEquipment(
    roomId: string,
    assetCode: string,
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${encodeURIComponent(roomId)}/equipment/${encodeURIComponent(assetCode)}`,
    );
  }

  updateStatus(
    roomId: string,
    assetCode: string,
    status: RoomEquipment['status'],
  ): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/${encodeURIComponent(roomId)}/equipment/${encodeURIComponent(assetCode)}/status`,
      { status },
    );
  }
}
