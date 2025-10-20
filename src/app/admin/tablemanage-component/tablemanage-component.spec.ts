import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablemanageComponent } from './tablemanage-component';

describe('TablemanageComponent', () => {
  let component: TablemanageComponent;
  let fixture: ComponentFixture<TablemanageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablemanageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablemanageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
