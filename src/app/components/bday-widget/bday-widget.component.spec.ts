import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BdayWidgetComponent } from './bday-widget.component';

describe('BdayWidgetComponent', () => {
  let component: BdayWidgetComponent;
  let fixture: ComponentFixture<BdayWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BdayWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BdayWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
