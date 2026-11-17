import { Component } from '@angular/core';
import { LoginFormComponent } from './login-form/login-form.component';
import { BrandPanelComponent } from './brand-panel/brand-panel.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LoginFormComponent, BrandPanelComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {}
