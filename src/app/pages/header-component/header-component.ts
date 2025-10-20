import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { TableIdService } from '../../services/tableId.service';

@Component({
  selector: 'app-header-component',
  // imports: [RouterLink],
  templateUrl: './header-component.html',
  styleUrl: './header-component.css'
})
export class HeaderComponent {

  constructor(private cartService: CartService, private tableIdService: TableIdService, private router: Router) { }

  goToCart() {
    this.router.navigate(['/cart'], {
      queryParams: { tId: this.tableIdService.tableId, table: this.tableIdService.tableName }
    });
  }

  cartItemCount(): number {
    return this.cartService.getCart().length;
  }

}
