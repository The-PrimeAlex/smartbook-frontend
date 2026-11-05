import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { NewRoomComponent } from './new-room.component.css';

describe('NewRoomComponent', () => {
  let component: NewRoomComponent;
  let fixture: ComponentFixture<NewRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewRoomComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewRoomComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
