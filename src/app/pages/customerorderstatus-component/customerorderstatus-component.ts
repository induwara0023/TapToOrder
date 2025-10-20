import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HeaderComponent } from '../header-component/header-component';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { BillStateService } from '../../services/bill-state.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-customerorderstatus-component',
  standalone: true,
  templateUrl: './customerorderstatus-component.html',
  styleUrls: ['./customerorderstatus-component.css'],
  imports: [HeaderComponent, CommonModule, RouterLink, NgbModalModule],
  providers: [ApiService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerorderstatusComponent implements OnInit {
  errorMessage: string = '';
  tableId: string | null = null;
  sessionId: string | null = null;
  orderDetails: any[] = [];
  allOrders: any[] = [];

  constructor(
    private modalService: NgbModal,
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private billState: BillStateService,
    private cdr: ChangeDetectorRef,
    private ws: WebsocketService
  ) {}

  getGroupedOrderDetails(): any[] {
    if (!this.orderDetails || !Array.isArray(this.orderDetails)) return [];
    const grouped: { [key: string]: any } = {};
    for (const item of this.orderDetails) {
      const key = item.item_name ? item.item_name.trim().toLowerCase() : '';
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      if (grouped[key]) {
        grouped[key].qty += qty;
        grouped[key].price += price * qty;
      } else {
        grouped[key] = { ...item, qty, price: price * qty };
      }
    }
    return Object.values(grouped);
  }

  async refreshOrderDetails(): Promise<void> {
    await this.loadOrderDetails();
  }

  ngOnInit(): void {
    // Reload order details whenever tId query param changes
    this.route.queryParamMap.subscribe(params => {
      this.tableId = params.get('tId');
      this.loadOrderDetails();
      this.listenToSocketMessages();
    });
  }

  grossAmount(): number {
    if (!this.orderDetails || !Array.isArray(this.orderDetails)) return 0;
    return this.orderDetails.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0);
  }

  getOrderTotalWithTax(): number {
    if (!this.orderDetails || !Array.isArray(this.orderDetails)) return 0;
    const total = this.orderDetails.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0);
    return Math.round(total * 1.1); // Add 10% service charge and round
  }

  listenToSocketMessages(): void {
    this.ws.getMessages().subscribe(async (msg) => {
      if (msg.type === 'orderStatusUpdated') {
        // Reload order details to reflect latest status
        await this.loadOrderDetails();
      }
      // other message types handled here...
    });
  }

  async loadOrderDetails(): Promise<void> {
    this.tableId = this.route.snapshot.queryParamMap.get('tId');

    if (this.tableId) {
      this.tableId = this.tableId.trim();
      const data = await firstValueFrom(this.api.getOrderDetailsByTableId(this.tableId));
      if (Array.isArray(data.message)) {
        this.orderDetails = [...data.message];
        this.cdr.markForCheck();
        this.errorMessage = '';
        this.sessionId = this.orderDetails.length > 0 && this.orderDetails[0].session_id
          ? this.orderDetails[0].session_id
          : null;
      } else {
        this.orderDetails = [];
        this.errorMessage = data.message;
        this.sessionId = null;
      }
    } else {
      console.error('Table ID is null or undefined.');
      this.errorMessage = 'Table ID is missing.';
      this.orderDetails = [];
      this.sessionId = null;
    }
  }

  async requestBill(content: any) {
    try {
      const response = await firstValueFrom(this.api.requestBill(this.tableId, this.sessionId));
      if (response.success) {
        const billData = {
          tableId: this.tableId,
          sessionId: this.sessionId,
          items: this.orderDetails,
          grossAmount: this.grossAmount(),
          totalWithTax: this.getOrderTotalWithTax()
        };

        this.billState.setBillData(billData);

        this.orderDetails = [];
        this.open(content);

        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 500);
      }
    } catch (error) {
      console.error('Error requesting bill:', error);
    }
  }

  open(content: any) {
    this.modalService.open(content, { size: 'lg', centered: true });
  }

  closeAndRedirect(modal: any) {
    modal.close();
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 1000); // 200ms delay for modal animation
  }
}
