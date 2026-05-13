import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RankingWidgetComponent } from './ranking-widget.component';

describe('RankingWidgetComponent', () => {
  let component: RankingWidgetComponent;
  let fixture: ComponentFixture<RankingWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RankingWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RankingWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
