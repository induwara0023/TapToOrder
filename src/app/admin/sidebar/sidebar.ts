import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'] ,
  imports: [RouterLink, RouterLinkActive, CommonModule],
})
export class Sidebar {
  currentRole: number | null = null;

  constructor(private router: Router) {
    this.readRole();
  }

  private readRole() {
    try {
      const userStr = localStorage.getItem('currentUser') ?? '';
      if (!userStr) {
        this.currentRole = null;
        return;
      }
      const user = JSON.parse(userStr);
      this.currentRole = Number(user?.role) || null;
    } catch (err) {
      this.currentRole = null;
    }
  }

  get isAdmin() {
    return this.currentRole === 1;
  }

  get isStaff() {
    return this.currentRole === 2;
  }

  get isCashier() {
    return this.currentRole === 3;
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/signin']);
  }
}
