import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { CreateBookingComponent } from './create-booking.component.css';

describe('CreateBookingComponent', () => {
  let component: CreateBookingComponent;
  let fixture: ComponentFixture<CreateBookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateBookingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      CreateBookingComponent,
    );
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
