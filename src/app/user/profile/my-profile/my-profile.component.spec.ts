import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { MyProfileComponent } from './my-profile.component.css';

describe('MyProfileComponent', () => {
  let component: MyProfileComponent;
  let fixture: ComponentFixture<MyProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyProfileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      MyProfileComponent,
    );
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
