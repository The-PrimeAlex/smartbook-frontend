import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { RegistrationComponent } from './registration.component.css';

describe('RegistrationComponent', () => {
  let component: RegistrationComponent;
  let fixture: ComponentFixture<RegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      RegistrationComponent,
    );
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
