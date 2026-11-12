import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { ViewRoomsComponent } from './view-rooms.component.css';

describe('ViewRoomsComponent', () => {
  let component: ViewRoomsComponent;
  let fixture: ComponentFixture<ViewRoomsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewRoomsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      ViewRoomsComponent,
    );
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
