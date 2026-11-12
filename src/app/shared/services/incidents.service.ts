import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';
import {
  Injectable,
  inject,
} from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IncidentType {
  value:
    'EQUIPMENT_DAMAGE' | 'ROOM_DAMAGE' | 'OTHER';
  label: string;
}

export interface IncidentStatus {
  value:
    | 'REPORTED'
    | 'VERIFIED'
    | 'REJECTED'
    | 'CHARGED';
  label: string;
}

export interface CreateIncidentRequest {
  roomId: string;
  incidentType:
    'EQUIPMENT_DAMAGE' | 'ROOM_DAMAGE' | 'OTHER';
  description: string;
}

export interface IncidentActionRequest {
  chargeAmount: number;
  reason: string;
}

export interface IncidentResponse {
  incidentId: string;
  incidentType: string;
  description: string;
  incidentStatus: string;
  roomName: string | null;
  reportedAt: string;
  chargeAmount: number | null;
  reportedByName: string | null;
  verifiedByName: string | null;
  roleDescription: string | null;
}

@Injectable({ providedIn: 'root' })
export class IncidentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/incidents/me`;
  private readonly adminUrl = `${environment.apiUrl}/incidents`;

  createIncident(
    request: CreateIncidentRequest,
  ): Observable<IncidentResponse> {
    return this.http.post<IncidentResponse>(
      this.baseUrl,
      request,
    );
  }

  getMyIncidents(): Observable<
    IncidentResponse[]
  > {
    return this.http.get<IncidentResponse[]>(
      this.baseUrl,
    );
  }

  // Admin methods

  getAllIncidents(
    status?: string,
  ): Observable<IncidentResponse[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<IncidentResponse[]>(
      this.adminUrl,
      { params },
    );
  }

  chargeIncident(
    incidentId: string,
    request: IncidentActionRequest,
  ): Observable<IncidentResponse> {
    return this.http.post<IncidentResponse>(
      `${this.adminUrl}/${incidentId}/charge`,
      request,
    );
  }

  waiveIncident(
    incidentId: string,
    request: IncidentActionRequest,
  ): Observable<IncidentResponse> {
    return this.http.post<IncidentResponse>(
      `${this.adminUrl}/${incidentId}/waive`,
      request,
    );
  }

  verifyIncident(
    incidentId: string,
  ): Observable<IncidentResponse> {
    return this.http.post<IncidentResponse>(
      `${this.adminUrl}/${incidentId}/verify`,
      {},
    );
  }
}
