import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TableIdService {
    tableId: string | null = null;
    tableName: string | null = null;
}
