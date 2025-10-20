import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AdminHeader } from '../admin-header/admin-header';
import { Sidebar } from '../sidebar/sidebar';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { WebsocketService } from '../../services/websocket.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-ordermanage-component',
  standalone: true,
  imports: [AdminHeader, Sidebar, CommonModule, RouterOutlet],
  templateUrl: './ordermanage-component.html',
  styleUrls: ['./ordermanage-component.css'],
})
export class OrdermanageComponent implements OnInit {
  orderStatus: any[] = [];
  orderDetails: any[] = [];
  allOrders: any[] = [];
  selectedStatus: string = 'Pending';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private wsServer: WebsocketService
  ) {}

  ngOnInit(): void {
    this.wsServer.connect();

    // 🟢 Real-time updates
    this.wsServer.getMessages().subscribe((msg: any) => {
      console.log('Real-time message:', msg);
      if (msg.type === 'newOrderPlaced') {
        this.getOrderDetails();
        this.cdr.detectChanges();
      }
    });

    this.loadOrderStatus();
    this.getOrderDetails();
  }

  async loadOrderStatus(): Promise<void> {
    try {
      const response = await this.api.getOrderStatus();
      this.orderStatus = response;
    } catch (error) {
      console.error('Error loading order status:', error);
    }
  }

  async getOrderDetails(): Promise<void> {
    try {
      const response = await firstValueFrom(this.api.getOrderDetails());

      if (response?.success) {
        const allOrders: any[] = [];

        if (response.data && typeof response.data === 'object') {
          Object.keys(response.data).forEach((key) => {
            const table = response.data[key];
            if (table.orders && Array.isArray(table.orders)) {
              table.orders.forEach((order: any) => {
                const orderTotal =
                  order.items?.reduce(
                    (sum: number, item: any) =>
                      sum + item.price * item.quantity,
                    0
                  ) || 0;

                allOrders.push({
                  ...order,
                  tableName: table.tableName,
                  sessionId: table.sessionId,
                  total: orderTotal,
                });
              });
            }
          });
        }

        this.allOrders = allOrders;
        this.filterByStatus(this.selectedStatus);
      } else {
        console.error('Failed to get order details:', response?.message);
      }
    } catch (error) {
      console.error('Error getting order details:', error);
    }
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.orderDetails = this.allOrders.filter(
      (order) => order.orderStatus === status
    );
    this.cdr.detectChanges();
  }

  async handleOrderStatusChange(order: any): Promise<void> {
    if (!order) return;

    let newStatusId: number;
    let newStatusText: string;

    if (order.orderStatus === 'Pending') {
      newStatusId = 2;
      newStatusText = 'Preparing';
    } else if (order.orderStatus === 'Preparing') {
      newStatusId = 3;
      newStatusText = 'Completed';
    } else {
      console.log('Order already completed.');
      return;
    }

    try {
      const response = await firstValueFrom(
        this.api.updateOrderStatus(order.orderId, newStatusId)
      );

      if (response.success) {
        order.orderStatus = newStatusText;

        // ✅ Print when moving from Pending → Preparing
        if (newStatusText === 'Preparing') {
          this.printBill(order);
        }

        this.filterByStatus(this.selectedStatus);
        console.log(`Order #${order.orderId} updated to ${newStatusText}`);
      } else {
        console.error('Failed to update status:', response.message);
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  }

  // 🧾 Beautified Bill HTML Generator
  private generateBillHTML(order: any, total: number): string {
    return `
    <html>
      <head>
        <title>Bill - Order ${order.orderId}</title>
        <style>
          body {
            font-family: "Courier New", monospace;
            background: #fff;
            padding: 15px;
            width: 300px;
            margin: auto;
          }
          h3 {
            text-align: center;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          .details p {
            margin: 2px 0;
            font-size: 14px;
          }
          hr {
            border: none;
            border-top: 1px dashed #aaa;
            margin: 8px 0;
          }
          .item {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            margin: 3px 0;
          }
          .total {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 15px;
            border-top: 1px dashed #000;
            margin-top: 10px;
            padding-top: 5px;
          }
          .footer {
            text-align: center;
            font-size: 13px;
            margin-top: 15px;
            border-top: 1px dashed #aaa;
            padding-top: 5px;
          }
        </style>
      </head>
      <body>
        <h3>Restaurant Bill</h3>
        <div class="details">
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Table:</strong> ${order.tableName}</p>
        </div>
        <hr>
        ${order.items
          .map(
            (item: any) => `
            <div class="item">
              <span>${item.quantity} × ${item.itemName}</span>
              <span>Rs ${item.totalPrice || item.price}</span>
            </div>`
          )
          .join('')}
        <div class="total">
          <span>Total:</span>
          <span>Rs ${total}</span>
        </div>
        <div class="footer">
          <p>${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>`;
  }

  // 🖨️ Print Function
  private printBill(order: any): void {
    if (!order.items || !Array.isArray(order.items)) {
      console.error('No items found for this order:', order);
      return;
    }

    const total = order.items.reduce(
      (sum: number, item: any) =>
        sum + (item.totalPrice || item.price * item.quantity),
      0
    );

    const billWindow = window.open('', '_blank', 'width=400,height=600');
    if (billWindow) {
      billWindow.document.write(this.generateBillHTML(order, total));
      billWindow.document.close();
      billWindow.focus();
      billWindow.print();
    } else {
      alert('Please allow popups to print the bill.');
    }
  }
}
