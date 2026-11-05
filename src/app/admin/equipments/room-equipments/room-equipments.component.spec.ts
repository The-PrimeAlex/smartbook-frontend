import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { RoomEquipmentsComponent } from './room-equipments.component.css';

describe('RoomEquipmentsComponent', () => {
  let component: RoomEquipmentsComponent;
  let fixture: ComponentFixture<RoomEquipmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomEquipmentsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      RoomEquipmentsComponent,
    );
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
