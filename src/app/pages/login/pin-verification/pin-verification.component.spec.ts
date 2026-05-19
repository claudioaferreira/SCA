import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PinVerificationComponent } from './pin-verification.component';

describe('PinVerificationComponent', () => {
  let component: PinVerificationComponent;
  let fixture: ComponentFixture<PinVerificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PinVerificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PinVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
