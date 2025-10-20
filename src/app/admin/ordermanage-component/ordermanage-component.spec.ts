import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdermanageComponent } from './ordermanage-component';

describe('OrdermanageComponent', () => {
  let component: OrdermanageComponent;
  let fixture: ComponentFixture<OrdermanageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdermanageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdermanageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
