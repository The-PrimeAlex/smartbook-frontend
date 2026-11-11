import {
  effect,
  Injectable,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Observable, Subject, interval } from 'rxjs';

export interface InactivityState {
  /** Whether the warning modal is currently visible */
  warningVisible: boolean;
  /** Seconds remaining before auto-logout (counting down from grace period) */
  secondsRemaining: number;
  /** Whether the user has been logged out due to inactivity */
  loggedOut: boolean;
  /** Whether the back-navigation warning modal is visible */
  backNavWarning: boolean;
}

@Injectable({ providedIn: 'root' })
export class InactivityService {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  /** Total inactivity time before showing the warning (10 minutes = 600000ms) */
  private readonly inactivityTimeout = 10 * 60 * 1000;
  /** Grace period after warning before actual logout (60 seconds) */
  private readonly gracePeriod = 60;

  /** Track the last activity timestamp */
  private lastActivity = Date.now();

  /** Timer interval IDs for cleanup */
  private checkIntervalId: ReturnType<
    typeof setInterval
  > | null = null;
  private countdownIntervalId: ReturnType<
    typeof setInterval
  > | null = null;

  /** State signal for the UI */
  private readonly state = signal<InactivityState>({
    warningVisible: false,
    secondsRemaining: 0,
    loggedOut: false,
    backNavWarning: false,
  });

  /** Subject for countdown ticks */
  private readonly countdown$ = new Subject<number>();

  /** Observable for countdown ticks */
  get countdownObservable(): Observable<number> {
    return this.countdown$.asObservable();
  }

  /** Current state as readonly signal */
  readonly stateSignal = this.state.asReadonly();

  constructor() {
    this.bindActivityListeners();
    // Only start monitoring when a user is authenticated.
    // When the user logs out (token cleared), stop the timer immediately.
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.lastActivity = Date.now();
        this.startMonitoring();
      } else {
        this.stopMonitoring();
        // Reset state so no stale warning modal appears for logged-out visitors
        this.state.set({
          warningVisible: false,
          secondsRemaining: 0,
          loggedOut: false,
          backNavWarning: false,
        });
      }
    });
  }

  /** Bind global activity event listeners */
  private bindActivityListeners() {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'touchmove',
      'click',
      'DOMMouseScroll',
      'mspointerdown',
    ];

    for (const event of events) {
      document.addEventListener(
        event,
        () => this.onActivity(),
        { passive: true },
      );
    }
  }

  /** Called on every user activity event */
  private onActivity() {
    const now = Date.now();
    this.lastActivity = now;

    /* If the warning is showing and the user is active, reset everything */
    if (this.state().warningVisible) {
      this.reset();
    }
  }

  /** Start the inactivity monitoring loop */
  private startMonitoring() {
    this.checkIntervalId = setInterval(() => {
      if (
        this.state().warningVisible ||
        this.state().loggedOut
      ) {
        return;
      }

      const elapsed = Date.now() - this.lastActivity;
      if (elapsed >= this.inactivityTimeout) {
        this.showWarning();
      }
    }, 1000);
  }

  /** Show the warning modal and start the countdown */
  private showWarning() {
    this.state.set({
      warningVisible: true,
      secondsRemaining: this.gracePeriod,
      loggedOut: false,
      backNavWarning: false,
    });

    this.startCountdown();
  }

  /** Start the countdown timer */
  private startCountdown() {
    let remaining = this.gracePeriod;

    this.countdownIntervalId = setInterval(() => {
      remaining--;
      this.state.update((s) => ({
        ...s,
        secondsRemaining: remaining,
      }));
      this.countdown$.next(remaining);

      if (remaining <= 0) {
        this.performLogout();
      }
    }, 1000);
  }

  /** Perform the actual logout */
  private performLogout() {
    this.stopMonitoring();
    this.authService.clearLocalAuth();
    this.state.set({
      warningVisible: false,
      secondsRemaining: 0,
      loggedOut: true,
      backNavWarning: false,
    });
    // Mark the session as expired so the auth guard won't re-authenticate via back button
    sessionStorage.setItem(
      'smartbook-session-expired',
      'true',
    );
    // Disable bfcache so the page cannot be restored from memory via back button
    window.addEventListener('beforeunload', () => {});
    // Prevent back button from restoring authenticated pages from bfcache
    window.onpageshow = (event) => {
      if (event.persisted) {
        window.location.replace('/login');
      }
    };
    // Push a history state so the back button triggers our popstate handler
    // instead of silently navigating to a previous authenticated page
    history.pushState(
      { logout: true },
      '',
      window.location.pathname,
    );
    // Bind the back-navigation handler only after logout, not during normal use
    this.bindBackNavigationHandler();
    // Show the logged-out state to trigger the back-nav warning on back button
    this.state.update((s) => ({ ...s, loggedOut: true }));
  }

  /** Bind the back-navigation handler (called only after logout) */
  private bindBackNavigationHandler() {
    window.addEventListener('popstate', () => {
      // When the user presses back after logout, prevent navigation and show warning
      if (this.state().loggedOut) {
        // Push state forward to cancel the back navigation
        history.pushState(
          { logout: true },
          '',
          window.location.pathname,
        );
        // Show the back-nav warning modal
        this.state.update((s) => ({
          ...s,
          backNavWarning: true,
        }));
      }
    });
  }

  /** Confirm the back navigation and proceed to login */
  confirmBackNavigation() {
    this.state.set({
      warningVisible: false,
      secondsRemaining: 0,
      loggedOut: false,
      backNavWarning: false,
    });
    window.location.replace('/login');
  }

  /** Dismiss the back navigation warning and redirect to login */
  dismissBackNavigation() {
    // Instead of letting the user stay on a stale page, force a hard redirect to login.
    // This prevents the back button from restoring a previous authenticated page from history.
    this.state.set({
      warningVisible: false,
      secondsRemaining: 0,
      loggedOut: false,
      backNavWarning: false,
    });
    // Replace the current history entry with login so back navigation goes nowhere
    history.replaceState(null, '', '/login');
    window.location.replace('/login');
  }

  /** Reset all timers and state (called when user stays or becomes active) */
  stay() {
    this.stopMonitoring();
    this.lastActivity = Date.now();
    this.state.set({
      warningVisible: false,
      secondsRemaining: 0,
      loggedOut: false,
      backNavWarning: false,
    });
    this.startMonitoring();
  }

  reset() {
    this.stopMonitoring();
    this.lastActivity = Date.now();
    this.state.set({
      warningVisible: false,
      secondsRemaining: 0,
      loggedOut: false,
      backNavWarning: false,
    });
    this.startMonitoring();
  }

  /** Stop all timers */
  private stopMonitoring() {
    if (this.checkIntervalId !== null) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    if (this.countdownIntervalId !== null) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
  }

  /** Cleanup on destroy */
  destroy() {
    this.stopMonitoring();
    this.countdown$.complete();
  }
}
