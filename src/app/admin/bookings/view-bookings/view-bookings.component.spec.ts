import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { ViewBookingsComponent } from './view-bookings.component.css';

describe('ViewBookingsComponent', () => {
  let component: ViewBookingsComponent;
  let fixture: ComponentFixture<ViewBookingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewBookingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      ViewBookingsComponent,
    );
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
