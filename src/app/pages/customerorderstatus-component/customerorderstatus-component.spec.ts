import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerorderstatusComponent } from './customerorderstatus-component';

describe('CustomerorderstatusComponent', () => {
  let component: CustomerorderstatusComponent;
  let fixture: ComponentFixture<CustomerorderstatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerorderstatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerorderstatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
