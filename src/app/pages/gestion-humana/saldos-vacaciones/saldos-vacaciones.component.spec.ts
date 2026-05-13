import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaldosVacacionesComponent } from './saldos-vacaciones.component';

describe('SaldosVacacionesComponent', () => {
  let component: SaldosVacacionesComponent;
  let fixture: ComponentFixture<SaldosVacacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaldosVacacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaldosVacacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
