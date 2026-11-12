import {
  Injectable,
  effect,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(
    DOCUMENT,
  ) as Document;
  private readonly STORAGE_KEY =
    'smartbook-theme';

  /** Current theme mode stored in localStorage */
  private get storedTheme(): ThemeMode | null {
    try {
      return localStorage.getItem(
        this.STORAGE_KEY,
      ) as ThemeMode | null;
    } catch {
      return null;
    }
  }

  /** Detect system preference for dark mode */
  private get systemPrefersDark(): boolean {
    try {
      return window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
    } catch {
      return false;
    }
  }

  /** Initialize theme on service creation */
  constructor() {
    const theme = this.storedTheme ?? 'light';
    this.applyTheme(theme);

    // Listen for system preference changes
    try {
      window
        .matchMedia(
          '(prefers-color-scheme: dark)',
        )
        .addEventListener('change', (e) => {
          if (!this.storedTheme) {
            this.applyTheme(
              e.matches ? 'dark' : 'light',
            );
          }
        });
    } catch {
      // Ignore if not supported
    }
  }

  /** Get the current theme mode */
  get currentTheme(): ThemeMode {
    return (this.document.documentElement.getAttribute(
      'data-theme',
    ) ?? 'light') as ThemeMode;
  }

  /** Check if dark mode is currently active */
  get isDark(): boolean {
    return this.currentTheme === 'dark';
  }

  /** Toggle between light and dark mode */
  toggle(): ThemeMode {
    const next = this.isDark ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  /** Set a specific theme mode */
  setTheme(theme: ThemeMode): void {
    this.applyTheme(theme);
    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        theme,
      );
    } catch {
      // Ignore storage errors
    }
  }

  /** Apply theme to the document */
  private applyTheme(theme: ThemeMode): void {
    this.document.documentElement.setAttribute(
      'data-theme',
      theme,
    );
    if (theme === 'dark') {
      this.document.documentElement.classList.add(
        'dark',
      );
    } else {
      this.document.documentElement.classList.remove(
        'dark',
      );
    }
  }
}
