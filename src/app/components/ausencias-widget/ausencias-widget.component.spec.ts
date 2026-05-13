import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AusenciasWidgetComponent } from './ausencias-widget.component';

describe('AusenciasWidgetComponent', () => {
  let component: AusenciasWidgetComponent;
  let fixture: ComponentFixture<AusenciasWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AusenciasWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AusenciasWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
