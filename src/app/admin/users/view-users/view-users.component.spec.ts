import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { ViewUsersComponent } from './view-users.component.css';

describe('ViewUsersComponent', () => {
  let component: ViewUsersComponent;
  let fixture: ComponentFixture<ViewUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewUsersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      ViewUsersComponent,
    );
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
