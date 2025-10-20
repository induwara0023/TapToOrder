// bill-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BillStateService {
  private billDataSource = new BehaviorSubject<any>(null);
  billData$ = this.billDataSource.asObservable();

  // method to update data
  setBillData(data: any) {
    this.billDataSource.next(data);
  }
}
