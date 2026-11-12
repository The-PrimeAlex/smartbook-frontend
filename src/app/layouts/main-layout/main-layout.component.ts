import {
  Component,
  ViewChild,
} from '@angular/core';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import {
  LucideMenu,
  LucideX,
} from '@lucide/angular';
import { IconComponent } from '../../shared/ui';

@Component({
  imports: [
    SidebarComponent,
    RouterOutlet,
    IconComponent,
  ],
  selector: 'app-main-layout',
  styleUrl: './main-layout.component.css',
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  @ViewChild(SidebarComponent)
  sidebar!: SidebarComponent;

  readonly LucideMenu = LucideMenu;
  readonly LucideX = LucideX;

  toggleSidebar(): void {
    this.sidebar?.toggleMobileOpen();
  }

  closeSidebar(): void {
    this.sidebar?.closeMobile();
  }
}
