import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { BrandPanelComponent } from './brand-panel.component';

describe('BrandPanelComponent', () => {
  let component: BrandPanelComponent;
  let fixture: ComponentFixture<BrandPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      BrandPanelComponent,
    );
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
