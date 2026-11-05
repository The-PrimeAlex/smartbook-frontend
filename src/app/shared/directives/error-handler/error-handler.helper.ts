import { HttpErrorResponse } from '@angular/common/http';

/** Extracts a human-readable error message from an HttpErrorResponse. */
export function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof HttpErrorResponse) {
    const message = error.error?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    const errorText = error.error?.error;
    if (typeof errorText === 'string' && errorText.trim()) {
      return errorText;
    }
  }
  return fallback;
}
