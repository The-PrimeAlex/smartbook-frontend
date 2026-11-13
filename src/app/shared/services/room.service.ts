import {
  Injectable,
  inject,
} from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';
import {
  Observable,
  catchError,
  switchMap,
  throwError,
} from 'rxjs';
import {
  MeetingRoom,
  RoomDetails,
} from '../models/room.model';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';

export type CreateRoomRequest = Omit<
  MeetingRoom,
  'roomId'
>;

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/rooms`;

  getRooms(): Observable<MeetingRoom[]> {
    return this.http
      .get<MeetingRoom[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  createRoom(
    request: CreateRoomRequest,
  ): Observable<MeetingRoom> {
    return this.authService.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http
          .post<MeetingRoom>(this.apiUrl, request)
          .pipe(catchError(this.handleError)),
      ),
    );
  }

  getRoomDetails(
    roomId: string,
  ): Observable<RoomDetails> {
    return this.http
      .get<RoomDetails>(
        `${this.apiUrl}/${encodeURIComponent(roomId)}/details`,
      )
      .pipe(catchError(this.handleError));
  }

  updateRoom(
    roomId: string,
    request: CreateRoomRequest,
  ): Observable<MeetingRoom> {
    return this.authService.ensureCsrfToken().pipe(
      switchMap(() =>
        this.http
          .put<MeetingRoom>(
            `${this.apiUrl}/${encodeURIComponent(roomId)}`,
            request,
          )
          .pipe(catchError(this.handleError)),
      ),
    );
  }

  private handleError(error: HttpErrorResponse) {
    let message =
      'Something went wrong. Please try again.';

    if (error.status === 0) {
      message =
        'Could not connect to the API. Check the backend and proxy configuration.';
    } else if (error.status === 400) {
      message =
        'The room details are invalid. Please check your entries.';
    } else if (
      error.status === 401 ||
      error.status === 403
    ) {
      message =
        'You are not authorized to perform this action.';
    } else if (error.status === 409) {
      message =
        'A room with conflicting details already exists.';
    } else if (error.status >= 500) {
      message =
        'The server encountered an error. Please try again.';
    }

    return throwError(() => new Error(message));
  }
}
