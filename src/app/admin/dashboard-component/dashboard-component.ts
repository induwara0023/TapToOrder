import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { AdminHeader } from '../admin-header/admin-header';
import { Sidebar } from '../sidebar/sidebar';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, NgFor, NgForOf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { RouterOutlet } from '@angular/router';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [AdminHeader, Sidebar, ReactiveFormsModule, RouterOutlet, CommonModule],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.css',
})
export class DashboardComponent implements OnInit {
  content: any;
  categoryForm: any;
  mostSoldItems: any;
  categories: any[] = [];

  ordersToday = 0;
  ordersPending = 0;
  ordersCompleted = 0;
  ordersMonthly = 0;

  loading = true;

  constructor(
    private api: ApiService,
    @Inject(NgbModal) private modelService: NgbModal,
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
    private ws: WebsocketService
  ) {
    // this.categoryService.loadCategories();
    // this.loadDashboardCounts();

    this.categoryForm = this.fb.group({
      newCatName: ['', [Validators.required]],
    });
    this.mostSellingItems();
    // this.loadDashboardCounts();
  }

  open(content: any) {
    this.modelService.open(content, { size: 'lg', centered: true });
  }

  // load categories
  async ngOnInit(): Promise<void> {
    await this.loadDashboardCounts();
    this.loading=false;

    this.ws.getMessages().subscribe(msg => {
      if (msg.type === 'dashboard_update') {
        this.loadDashboardCounts();
        this.cdr.detectChanges();
      }
    });

    this.categories = await this.categoryService.loadCategories();
    this.cdr.detectChanges();
  }

  async loadDashboardCounts(): Promise<void> {
    try {
      const data = await firstValueFrom(this.api.getDashboardCounts());
      console.log('Dashboard counts:', data);

      this.ordersToday = data.todays_orders || 0;
      this.ordersPending = data.pending_orders || 0;
      this.ordersCompleted = data.completed_orders || 0;
      this.ordersMonthly = data.monthly_orders || 0;
    } catch (error) {
      console.error('Failed to load dashboard counts:', error);
    }
  }


  // Add new category
  async addNewCat(): Promise<void> {
    // Check if form is valid
    if (this.categoryForm.invalid) {
      this.categoryForm.get('newCatName')?.markAsTouched();
      return;
    }

    const categoryName = await this.categoryForm
      .get('newCatName')
      ?.value?.trim();

    try {
      // Call backend
      const response: any = await firstValueFrom(
        this.api.addNewCategory(categoryName)
      );
      console.log('Backend Response: ', response);

      // Handle success/failure based on backend response
      if (response.success) {
        this.categories.push({ name: response.name });
        this.modelService.dismissAll();
        this.categoryForm.reset();
      } else {
        console.error('Failed to add category:', response.error);
        // Optionally show a message to user here
      }
    } catch (error) {
      console.error('Error adding new category:', error);
    }
  }

  // load most selling items
  async mostSellingItems(): Promise<void> {
    try {
      const response = await firstValueFrom(this.api.getMostSellingItems());
      if (response.success) {
        this.mostSoldItems = response.data;
        this.cdr.detectChanges()
      } else {
        console.log("Data nnot found");
      }

    } catch (error) {
      console.error("erre :", error);
    }
  }

  // loard categories
  // async loadCategories(): Promise<void> {
  //   try {
  //     const data: any = await firstValueFrom(this.api.getCategories());
  //     if (data && Array.isArray(data)) {
  //       this.categories = data;
  //     } else if (data && Array.isArray(data.categories)) {
  //       this.categories = data.categories;
  //     } else {
  //       this.categories = [];
  //     }
  //   } catch (error) {
  //     console.error('Error processing categories:', error);
  //     this.categories = [];
  //   }
  // }
}
