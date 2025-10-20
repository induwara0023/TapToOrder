import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private cart: any[] = [];

    constructor() {
        if (this.isBrowser()) {
            const storedCart = localStorage.getItem('cart');
            this.cart = storedCart ? JSON.parse(storedCart) : [];
        }
    }

    private isBrowser(): boolean {
        return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    }

    private saveCart() {
        if (this.isBrowser()) {
            localStorage.setItem('cart', JSON.stringify(this.cart));
        }
    }

    getCart() {
        return this.cart;
    }

    addToCart(item: any) {
        const existing = this.cart.find(i => i.id === item.id);
        if (existing) {
            existing.qty += 1;
        } else {
            this.cart.push({ ...item, qty: 1 });
        }
        this.saveCart();
    }

    updateItemQty(itemId: number, qty: number) {
        const item = this.cart.find(i => i.id === itemId);
        if (item) {
            item.qty = qty;
            this.saveCart(); // <-- Save the updated cart
        }
    }

    removeFromCart(itemId: number) {
        this.cart = this.cart.filter(i => i.id !== itemId);
        this.saveCart();
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
    }
}

