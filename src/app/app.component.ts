import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AutoLogoutModalComponent } from './core/services/auto-logout-modal/auto-logout-modal.component';
import { InactivityService } from './core/services/inactivity.service';
import { OnDestroy } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    AutoLogoutModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnDestroy {
  private readonly inactivityService = inject(
    InactivityService,
  );

  ngOnDestroy(): void {
    this.inactivityService.destroy();
  }
}
