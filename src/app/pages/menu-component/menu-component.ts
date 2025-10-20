import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { HeaderComponent } from '../header-component/header-component';
import { ApiService } from '../../services/api.service';
import { CategoryService } from '../../services/category.service';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import Swal from 'sweetalert2';
// import { NfcGuard } from '../../guards/nfc-guard';
import { ActivatedRoute } from '@angular/router';
import { TableIdService } from '../../services/tableId.service';


@Component({
  selector: 'app-menu-component',
  standalone: true,
  imports: [HeaderComponent, CommonModule],
  templateUrl: './menu-component.html',
  styleUrl: './menu-component.css',
})
export class MenuComponent implements OnInit {
  menuDetails: any[] = [];
  categories: any[] = [];
  selectedCategoryId: number = 0;

  tableName: string = '';
  tableId: string = '';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private categoryService: CategoryService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private tableIdService: TableIdService
  ) { }

  // ✅ Tab click → category items load
  onCategoryChange(categoryId: number) {
    this.selectedCategoryId = categoryId;

    if (categoryId === 0) {
      // All items
      this.api.getMenuItems(0).subscribe((data) => {
        this.menuDetails = data;
        this.cdr.detectChanges();
      });
    } else {
      // Filter by category
      this.api.getMenuItemsByCategory(categoryId).subscribe((data) => {
        this.menuDetails = data;
        this.cdr.detectChanges();
      });
    }
  }



  // ✅ Load categories & all items initially
  async ngOnInit(): Promise<void> {
    // Load categories and filter out any "take away" variants so customers won't see the Take Away category
    const allCats = await this.categoryService.loadCategories();
    this.categories = (allCats || []).filter((c: any) => {
      const nm = (c.name || '').toString().trim().toLowerCase();
      // exclude obvious variants
      if (!nm) return false;
      if (nm === 'takeaway' || nm === 'take-away' || nm === 'take away' || nm.includes('take away foods') || nm.includes('take away')) return false;
      return true;
    });
    await this.loadMenuItems(0);

    const tId = this.route.snapshot.queryParamMap.get('tId');
    const table = this.route.snapshot.queryParamMap.get('table');

    this.tableIdService.tableId = tId;
    this.tableIdService.tableName = table;

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
      } else if (data && Array.isArray(data.menuDetails)) {
        this.menuDetails = data.menuDetails;
      } else {
        this.menuDetails = [];
      }

      this.cdr.detectChanges();
    } catch (error) {
      console.log('Error loading menu items:', error);
    }
  }

  // ✅ Add item to cart
  addToCart(item: any) {
    const cartItem = { ...item, qty: 1 };
    this.cartService.addToCart(cartItem);

    console.log('Cart after adding:', this.cartService.getCart());
    Swal.fire('Done', item.name + ' added to cart');
  }
}
