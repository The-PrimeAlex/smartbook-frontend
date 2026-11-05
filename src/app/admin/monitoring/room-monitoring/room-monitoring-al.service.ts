import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RoomMonitoringRecordAl {
  roomId: string | null;
  roomName: string | null;
  capacity: number | null;
  roomType: string | null;
  roomStatus: string | null;
  bookingId: string | null;
  purpose: string | null;
  bookerName: string | null;
  startTime: string | null;
  endTime: string | null;
  liveStatus: string | null;
  overrunMinutes: number | null;
  checkInTime: string | null;
  noShowDetectedAt: string | null;
}

export interface RoomBookingRecordAl {
  bookingId: string;
  purpose: string | null;
  bookerName: string | null;
  startTime: string;
  endTime: string;
  bookingStatus: string | null;
  checkInTime: string | null;
}

@Injectable({ providedIn: 'root' })
export class RoomMonitoringAlService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/admin/monitoring';

  getLiveRoomStatus(): Observable<
    RoomMonitoringRecordAl[]
  > {
    return this.http.get<RoomMonitoringRecordAl[]>(
      `${this.apiUrl}/live`,
    );
  }

  getNoShows(): Observable<RoomMonitoringRecordAl[]> {
    return this.http.get<RoomMonitoringRecordAl[]>(
      `${this.apiUrl}/no-shows`,
    );
  }

  getOverruns(): Observable<RoomMonitoringRecordAl[]> {
    return this.http.get<RoomMonitoringRecordAl[]>(
      `${this.apiUrl}/overruns`,
    );
  }

  getRoomBookings(roomId: string): Observable<RoomBookingRecordAl[]> {
    return this.http.get<RoomBookingRecordAl[]>(
      `${this.apiUrl}/room/${roomId}/bookings`,
    );
  }
}
