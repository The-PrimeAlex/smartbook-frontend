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
  map,
  throwError,
} from 'rxjs';
import {
  Setting,
  UpdateSettingRequest,
} from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/settings';

  getAllSettings(): Observable<Setting[]> {
    return this.http
      .get<Setting[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  getSettingsByCategory(
    category: string,
  ): Observable<Setting[]> {
    return this.http
      .get<Setting[]>(
        `${this.apiUrl}/category/${category}`,
      )
      .pipe(catchError(this.handleError));
  }

  getSettingValue(
    key: string,
  ): Observable<string | null> {
    return this.http
      .get<{ key: string; value: string | null }>(
        `${this.apiUrl}/value/${key}`,
      )
      .pipe(
        map((res) => res.value),
        catchError(this.handleError),
      );
  }

  updateSetting(
    request: UpdateSettingRequest,
  ): Observable<Setting> {
    return this.http
      .put<Setting>(this.apiUrl, request)
      .pipe(catchError(this.handleError));
  }

  bulkUpdateSettings(
    updates: UpdateSettingRequest[],
  ): Observable<Setting[]> {
    return this.http
      .put<Setting[]>(
        `${this.apiUrl}/bulk`,
        updates,
      )
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let message =
      'Something went wrong. Please try again.';
    if (error.status === 0) {
      message = 'Could not connect to the API.';
    } else if (error.status === 400) {
      message =
        'Invalid request. Please check your input.';
    } else if (
      error.status === 401 ||
      error.status === 403
    ) {
      message =
        'You are not authorized to modify settings.';
    } else if (error.status >= 500) {
      message = 'Server error. Please try again.';
    }
    return throwError(() => new Error(message));
  }
}
