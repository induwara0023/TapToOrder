import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { WebsocketService } from '../../services/websocket.service';
import { AdminHeader } from '../admin-header/admin-header';
import { Sidebar } from '../sidebar/sidebar';
import { promises } from 'node:dns';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-billing-component',
  standalone: true,
  templateUrl: './billing-component.html',
  styleUrls: ['./billing-component.css'],
  imports: [AdminHeader, Sidebar, CommonModule, RouterOutlet],
})
export class BillingComponent implements OnInit {
  billData: any[] = [];
  private isBrowser: boolean;
  currentDate: Date = new Date();

  constructor(
    private ws: WebsocketService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private api: ApiService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      const savedBills = localStorage.getItem('billData');
      if (savedBills) {
        this.billData = JSON.parse(savedBills);
        this.filterBillData();
      }
    }
    this.listenToBills();
  }

  listenToBills() {
    this.ws.getMessages().subscribe((msg) => {
      if (msg.type === 'billRequested') {
        if (!Array.isArray(msg.orderedItems)) {
          msg.orderedItems = Object.values(msg.orderedItems);
        }
        const grossAmount = msg.orderedItems.reduce(
          (sum: number, item: any) => sum + Number(item.total_price || 0),
          0
        );
        const serviceCharge = grossAmount * 0.1;
        const total = grossAmount + serviceCharge;

        msg.grossAmount = grossAmount;
        msg.serviceCharge = serviceCharge;
        msg.total = total;

        const existingIndex = this.billData.findIndex(
          (b) => b.tableId === msg.tableId
        );
        if (existingIndex !== -1) {
          this.billData[existingIndex] = msg;
        } else {
          this.billData.push(msg);
        }

        this.filterBillData();

        if (this.isBrowser) {
          localStorage.setItem('billData', JSON.stringify(this.billData));
        }
        this.cdr.markForCheck();
      }
    });
  }

  filterBillData() {
    // Only keep bills with a valid table name and at least one item
    this.billData = this.billData.filter(
      bill =>
        bill &&
        bill.orderedItems &&
        bill.orderedItems.length > 0 &&
        bill.tableName &&
        bill.tableName.trim() !== ''
    );
  }

  get validBills() {
    // Extra safety for template rendering; use this in your *ngFor!
    return this.billData;
  }

  async printAndRemoveBill(tableId: string, sessionId: number, grossAmount: number, serviceCharge: number): Promise<void> {
    const billToPrint = this.billData.find(b => b.tableId === tableId);

    try {

      const response = await firstValueFrom(this.api.requestFinalBill(tableId, sessionId, grossAmount, serviceCharge));

      if (response?.success) {
        const invoiceId = response.invoiceId;
        // invoiceId: response.invoiceId,
        console.log("done");

        if (!billToPrint) {
          console.error('Bill not found', tableId);
          return;
        }

        const billHTMLTemplate = `
      <html>
        <head>
          <title>Print Bill</title>
          <style>
            body {
              background: #ffffffff;
              font-family: "Courier New", monospace;
              padding: 20px;
              display: flex;
              justify-content: center;
              width: 400px;
              hight:auto;
            }
            .receipt { width: 320px; background: white; border: 1px solid #ccc; padding: 20px; box-shadow: 0 0 5px rgba(0,0,0,0.1);}
            .receipt-header { text-align: center; border-bottom: 1px dashed #aaa; margin-bottom: 10px; padding-bottom: 5px;}
            .receipt-header h4 { font-weight: bold; margin-bottom: 3px;}
            .itemDiv { border-top: 1px dashed #aaa;}
            .info, .items, .totals { font-size: 14px;}
            .items table { width: 100%; border-collapse: collapse;}
            .items td { font-size: 14px; padding: 3px 0;}
            .text-end { text-align: right;}
            .totals { border-top: 1px dashed #aaa; margin-top: 10px; padding-top: 10px;}
            .footer { text-align: center; border-top: 1px dashed #aaa; margin-top: 15px; padding-top: 10px; font-size: 13px;}
            .fw-bold { font-weight: bold;}
            .float-end { float: right;}
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="receipt-header">
              <h4>Hotel Anuhas</h4>
              <p>2nd floor, Uhana Rd,<br /> Ampara.<br />0112931470 / 0779510260</p>
            </div>
            <div class="info mb-2">
              <p><strong>Invoice Id #:</strong> ${invoiceId} &nbsp;</p>
            </div>
            <div class="items mb-2 itemDiv">
              <table class="table table-borderless">
                <tbody>
                  ${(billToPrint.orderedItems || [])
            .map(
              (item: any, index: number) => `
                      <tr>
                        <td>${index + 1} ${item.item_name}<br /><small>(${item.unit_price} * ${item.total_qty})</small></td>
                        <td class="text-end">Rs ${Number(item.total_price).toFixed(2)}</td>
                      </tr>`
            )
            .join('')}
              </tbody>
              </table>
            </div>
            <div class="totals">
              <p>Gross Amount <span class="float-end">Rs ${billToPrint.grossAmount.toFixed(2)}</span></p>
              <p>Service Charge (10%) <span class="float-end">Rs ${billToPrint.serviceCharge.toFixed(2)}</span></p>
              <p><strong>Total</strong> <span class="float-end fw-bold">Rs ${billToPrint.total.toFixed(2)}</span></p>
            </div>
            <div class="footer">
              <p>Invoice: ${invoiceId}<br />Date: ${new Date().toLocaleString()}</p>
              <p>Thank you. Come again.</p>
              <p class="fw-bold">System by Thriwex Software Company <br />075 7060941</p>
            </div>
          </div>
        </body>
      </html>
    `;

        const popupWin = window.open('', '_blank', 'width=400,height=auto');
        if (popupWin) {
          popupWin.document.write(billHTMLTemplate);
          popupWin.document.close();
          popupWin.print();
        }

        this.billData = this.billData.filter(b => b.tableId !== tableId);
        if (this.isBrowser) {
          localStorage.setItem('billData', JSON.stringify(this.billData));
        }
        this.cdr.markForCheck();
      } else {
        console.log(response.message);
      }

    } catch (error) {
      console.error("error ", error);
    }

  }
}
