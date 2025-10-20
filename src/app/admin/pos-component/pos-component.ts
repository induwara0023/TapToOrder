import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AdminHeader } from "../admin-header/admin-header";
import { Sidebar } from "../sidebar/sidebar";
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CategoryService } from '../../services/category.service';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pos-component',
  imports: [AdminHeader, Sidebar, RouterOutlet, CommonModule, FormsModule],
  templateUrl: './pos-component.html',
  styleUrl: './pos-component.css'
})
export class PosComponent implements OnInit {

  menuDetails: any[] = [];
  // currently visible items after applying search filter
  displayedMenu: any[] = [];
  // bound search term
  searchTerm: string = '';
  categories: any[] = [];
  selectedCategoryId: number = 0;

  cartItems: any[] = [];

  grossAmount: number = 0;
  taxAmount: number = 0;
  totalAmount: number = 0;
  taxRate: number = 0; // 0%

  constructor(private api: ApiService, private cdr: ChangeDetectorRef, private categoryService: CategoryService, private rout: ActivatedRoute) { }

  // ✅ Tab click → category items load
  onCategoryChange(categoryId: number) {
    this.selectedCategoryId = categoryId;

    // Delegate loading to loadMenuItems so displayedMenu gets initialized there
    this.loadMenuItems(categoryId).catch(err => console.error('Failed loading category items', err));
  }

  // ✅ Load categories & all items initially
  async ngOnInit(): Promise<void> {
    this.categories = await this.categoryService.loadCategories();

    // Try to auto-select a "take away" category so POS loads only take-away foods on start.
    // Accept common variants: 'take away', 'takeaway', 'take-away' (case-insensitive)
    const takeAwayCat = this.categories?.find(c => {
      if (!c || !c.name) return false;
      const nm = String(c.name).toLowerCase().replace(/\s+/g, '');
      return nm === 'takeaway' || nm === 'take-away' || nm.includes('take');
    });

    if (takeAwayCat) {
      this.selectedCategoryId = takeAwayCat.id;
      await this.loadMenuItems(this.selectedCategoryId);
    } else {
      // fallback: load all
      await this.loadMenuItems(0);
    }

    // const tId = this.route.snapshot.queryParamMap.get('tId');
    // const table = this.route.snapshot.queryParamMap.get('table');

    // this.tableIdService.tableId = tId;
    // this.tableIdService.tableName = table;

  }


  // ✅ Load menus
  async loadMenuItems(categoryId: number): Promise<void> {
    try {
      let data: any;

      if (categoryId === 0) {
        // All items
        data = await firstValueFrom(this.api.getMenuItems(0));
      } else {
        // Category wise
        data = await firstValueFrom(this.api.getMenuItemsByCategory(categoryId));
      }

      if (data && Array.isArray(data)) {
        this.menuDetails = data;
        this.displayedMenu = [...this.menuDetails];
      } else if (data && Array.isArray(data.menuDetails)) {
        this.menuDetails = data.menuDetails;
        this.displayedMenu = [...this.menuDetails];
      } else {
        this.menuDetails = [];
        this.displayedMenu = [];
      }

      this.cdr.detectChanges();
    } catch (error) {
      console.log('Error loading menu items:', error);
    }
  }

  // called on every key stroke in the search box (ngModel is also updated)
  onSearch(event?: KeyboardEvent) {
    this.applyFilter();
  }

  applyFilter() {
    const q = (this.searchTerm || '').trim().toLowerCase();
    if (!q) {
      this.displayedMenu = [...this.menuDetails];
      return;
    }

    this.displayedMenu = this.menuDetails.filter(item => {
      const name = (item?.name || '').toString().toLowerCase();
      const desc = (item?.description || '').toString().toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }

  calculateAmounts() {
    // calculate gross
    this.grossAmount = this.cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // compute service charge (tax) and round to 2 decimals
    const rawTax = this.grossAmount * this.taxRate;
    this.taxAmount = Math.round((rawTax + Number.EPSILON) * 100) / 100;

    // total
    this.totalAmount = Math.round(((this.grossAmount + this.taxAmount) + Number.EPSILON) * 100) / 100;
  }

  addToCart(item: any) {
    const existing = this.cartItems.find(ci => ci.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      this.cartItems.push({ ...item, qty: 1 });
    }
    this.calculateAmounts();
  }

  increaseQty(cartItem: any) {
    cartItem.qty += 1;
    this.calculateAmounts();
  }

  decreaseQty(cartItem: any) {
    if (cartItem.qty > 1) {
      cartItem.qty -= 1;
      this.calculateAmounts();
    } else {
      this.removeFromCart(cartItem);
    }
  }

  removeFromCart(cartItem: any) {
    const idx = this.cartItems.indexOf(cartItem);
    if (idx > -1) {
      this.cartItems.splice(idx, 1);
      this.calculateAmounts();
    }
  }

  clearCart() {
    this.cartItems = [];
    this.calculateAmounts();
  }

  // take away customers bill print
  async printTakeawayBill(items: any[], grossAmount: number, serviceCharge: number): Promise<void> {
    const total = grossAmount + serviceCharge;

    try {
      const response = await firstValueFrom(this.api.requestFinalBill(null, null, grossAmount, serviceCharge))
      if (response?.success) {
        const invoiceId = response.invoiceId;
        const billHTMLTemplate = `
      <html>
        <head>
          <title>Take Away Bill</title>
          <style>
            body { font-family: 'Courier New', monospace; padding:16px; background: #fff; }
            .receipt { width:320px; margin:auto; background:#fff; border:1px solid #ccc; padding:20px; box-shadow:0 0 5px rgba(0,0,0,0.1);}
            .receipt-header { text-align:center; border-bottom:1px dashed #aaa; margin-bottom:10px; padding-bottom:5px;}
            .receipt-header h4 { font-weight:bold; margin-bottom:3px;}
            .itemDiv { border-top:1px dashed #aaa;}
            .info, .items, .totals { font-size:14px;}
            .items table { width:100%; border-collapse:collapse;}
            .items td { font-size:14px; padding:3px 0;}
            .text-end { text-align:right;}
            .totals { border-top:1px dashed #aaa; margin-top:10px; padding-top:10px;}
            .footer { text-align:center; border-top:1px dashed #aaa; margin-top:15px; padding-top:10px; font-size:13px;}
            .fw-bold { font-weight:bold;}
            .float-end { float:right;}
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="receipt-header">
              <h4>Hotel Anuhas</h4>
              <p>2nd floor, Uhana Rd,<br/>Ampara.<br/>0112931470 / 0779510260</p>
            </div>
            <div class="info mb-2">
              <p><strong>Take Away Bill: </strong>${invoiceId}</p>
              <p>Date: ${new Date().toLocaleString()}</p>
            </div>
            <div class="items mb-2 itemDiv">
              <table>
                <tbody>
                ${items.map(
          (item: any, idx: number) => `
                    <tr>
                      <td>${idx + 1}. ${item.name}<br /><small>(${item.price} * ${item.qty})</small></td>
                      <td class="text-end">Rs ${(item.price * item.qty).toFixed(2)}</td>
                    </tr>`
        ).join('')}
                </tbody>
              </table>
            </div>
            <div class="totals">
              <p>Gross Amount <span class="float-end">Rs ${grossAmount.toFixed(2)}</span></p>
              <p>Service Charge (10%) <span class="float-end">Rs ${serviceCharge.toFixed(2)}</span></p>
              <p><strong>Total</strong> <span class="float-end fw-bold">Rs ${total.toFixed(2)}</span></p>
            </div>
            <div class="footer">
              <p>Thank you. Come again.</p>
              <p class="fw-bold">System by Thriwex Software Company <br/>075 7060941</p>
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
      } else {
        console.log(response.message);
      }

    } catch (error) {
      console.error("error ", error);
    }
  }


  payTakeAway() {
    // Ensure amounts are up-to-date before printing
    this.calculateAmounts();

    const gross = this.grossAmount;
    // Ensure at least the computed service charge is used (never 0 unintentionally)
    const service = this.taxAmount || Math.round((gross * this.taxRate + Number.EPSILON) * 100) / 100;

    this.printTakeawayBill(this.cartItems, gross, service);
    this.clearCart();
  }

}
