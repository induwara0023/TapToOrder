import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from "../header-component/header-component";
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-cart-component',
  imports: [HeaderComponent, CommonModule],
  templateUrl: './cart-component.html',
  styleUrl: './cart-component.css'
})
export class CartComponent implements OnInit {
  removeItem(itemId: number) {
    this.cartService.removeFromCart(itemId);
    this.cartItems = this.cartService.getCart();
    this.updateCartTotal();
  }

  cartItems: any[] = [];
  cartTotal: number = 0;

  tableId: String | null = null;

  constructor(private cartService: CartService, private route: ActivatedRoute, private api: ApiService) { }

  ngOnInit(): void {

    this.tableId = this.route.snapshot.queryParamMap.get('tId');
    console.log("Table ID from query params in CartComponent:", this.tableId);

    this.cartItems = this.cartService.getCart();
    this.cartTotal = this.cartItems.reduce((total, item) => total + item.price * item.qty, 0);
  }

  qty = 1;
  // specialRequest = '';

  increaseQty(item: any) {
    item.qty++;
    this.cartService.updateItemQty(item.id, item.qty); // Save to localStorage
    this.updateCartTotal();
  }

  decreaseQty(item: any) {
    if (item.qty > 1) {
      item.qty--;
      this.cartService.updateItemQty(item.id, item.qty); // Save to localStorage
      this.updateCartTotal();
    }
  }

  updateCartTotal() {
    this.cartTotal = this.cartItems.reduce((total, item) => total + item.price * item.qty, 0);
  }

  async placeOrder(cartItems: any[], tableId: String | null) {
    // Implement order placement logic here
    cartItems = this.cartItems;
    console.log(cartItems.length + " Order placed:", JSON.stringify(cartItems, null, 2) + " for tableId: " + tableId);

    try {
      // Simulate order placement API call
      const data = await firstValueFrom(this.api.placeOrder(cartItems, tableId));
      if (data.success) {
        console.log(data.message);
        // Show success message
        await Swal.fire("Done", "Order Places");
        this.cartService.clearCart();
        this.cartItems = [];
        this.cartTotal = 0;
        this.tableId = localStorage.getItem('tId');
        window.location.href = `/customerorderstatus?tId=${tableId}`;
        // window.location.href = `/customerorderstatus`;
      }else{
        console.log(data.message);
        await Swal.fire("Sorry", data.message);
      }


    } catch (error) {
      console.error("Error placing order:", error);
      await Swal.fire("Error", "Failed to place order. Please try again.");
      return;
    }


  }

  clearCart() {
    this.cartService.clearCart();
    this.cartItems = [];
    this.cartTotal = 0;
    console.log("Clearing cart");
    Swal.fire("Done", "Cart Cleared").then(() => {
      // Additional actions after the alert is closed
      window.location.href = "/menu?tId=" + this.tableId;
    });
  }
}
