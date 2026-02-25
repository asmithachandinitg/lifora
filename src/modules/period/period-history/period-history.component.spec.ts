import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeriodHistoryComponent } from './period-history.component';

describe('PeriodHistoryComponent', () => {
  let component: PeriodHistoryComponent;
  let fixture: ComponentFixture<PeriodHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeriodHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PeriodHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
