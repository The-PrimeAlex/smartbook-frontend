import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { RoomMonitoringAlComponent } from './room-monitoring-al.component.css';

describe('RoomMonitoringAlComponent', () => {
  let component: RoomMonitoringAlComponent;
  let fixture: ComponentFixture<RoomMonitoringAlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomMonitoringAlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      RoomMonitoringAlComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
