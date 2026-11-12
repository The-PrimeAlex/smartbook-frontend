import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { ReportsAlComponent } from './reports-al.component.css';

describe('ReportsAlComponent', () => {
  let component: ReportsAlComponent;
  let fixture: ComponentFixture<ReportsAlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsAlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      ReportsAlComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
