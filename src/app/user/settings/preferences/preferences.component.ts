import { Component, inject, signal } from '@angular/core';
import { IconComponent } from '../../../shared/ui';
import {
  LucideMoon,
  LucideSettings,
  LucideSun,
} from '@lucide/angular';
import { ThemeService } from '../../../core/services/theme.service';
import { PageBannerComponent } from '../../../shared/ui';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [PageBannerComponent, IconComponent],
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.css',
})
export class PreferencesComponent {
  private readonly themeService = inject(ThemeService);

  readonly LucideMoon = LucideMoon;
  readonly LucideSettings = LucideSettings;
  readonly LucideSun = LucideSun;
  readonly darkMode = signal(this.themeService.isDark);

  toggleDarkMode(): void {
    const next = this.themeService.toggle();
    this.darkMode.set(next === 'dark');
  }
}
