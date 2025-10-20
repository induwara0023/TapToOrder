import { Component, NgModule, OnInit } from '@angular/core';
import { AdminHeader } from '../admin-header/admin-header';
import { Sidebar } from '../sidebar/sidebar';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';
import { promises } from 'node:dns';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-menumanage-component',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, NgbModule, AdminHeader, Sidebar, FormsModule, RouterOutlet],
  templateUrl: './menumanage-component.html',
  styleUrl: './menumanage-component.css',
})
export class MenumanageComponent implements OnInit {

  addNewItemModal: any;
  itemUpdateModal: any;
  itemDetailsForm!: FormGroup;

  menuDetails: any[] = [];
  categories: any[] = [];
  selectedCategoryId: number = 0;

  selectedItem: any = {};

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private modelService: NgbModal,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef
  ) {
    this.loadMenuItems(this.selectedCategoryId);

    this.itemDetailsForm = this.fb.group({
      selectedItem: new FormControl({ value: '', disabled: true }),
      newMenuName: ['', [Validators.required]],
      newMenuDescription: ['', [Validators.required]],
      newMenuPrice: ['', [Validators.required, Validators.min(1)]],
      category: [0, Validators.required],
    });
  }

  // open new item add modal
  openNewItemAddingModal(addNewItemModal: any) {
    this.modelService.open(addNewItemModal, { size: 'lg', centered: true });
    this.resetForm();

  }

  // reset form
  resetForm() {
    this.itemDetailsForm = this.fb.group({
      selectedItem: new FormControl({ value: '', disabled: true }),
      newMenuName: ['', [Validators.required]],
      newMenuDescription: ['', [Validators.required]],
      newMenuPrice: ['', [Validators.required, Validators.min(1)]],
      category: [0, Validators.required],
    });
  }

  // load categories
  async ngOnInit(): Promise<void> {
    this.categories = await this.categoryService.loadCategories();
    this.cdr.detectChanges();

  }

  //load menus
  async loadMenuItems(selectedCategoryId: number): Promise<void> {
    try {
      const data: any = await firstValueFrom(this.api.getMenuItems(selectedCategoryId));
      if (data && Array.isArray(data)) {
        this.menuDetails = data;
        this.cdr.detectChanges();
      } else if (data && Array.isArray(data.menuDetails)) {
        this.menuDetails = data.menuDetails;
        this.cdr.detectChanges();
      } else {
        this.menuDetails = [];
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.log('Error :', error);
    }
  }

  // load menus by category
  selectedCategory: number | undefined;
  onCategoryChange() {
    const categoryId = this.selectedCategoryId;
    this.api.getMenuItemsByCategory(categoryId).subscribe(data => {
      this.menuDetails = data;
      this.cdr.detectChanges();
    });
  }

  //add new menu item
  async addNewItem(): Promise<void> {
    const newItemData = this.itemDetailsForm.value;
    const selectedCategory = newItemData.category;

    if (!selectedCategory || selectedCategory == 0) {
      console.log('Please select a category');
      return;
    }

    try {
      const response: any = await firstValueFrom(
        this.api.addNewMenuItem(newItemData)
      );

      if (response?.success) {
        this.loadMenuItems(this.selectedCategoryId);
        this.menuDetails.unshift(response.item);
        this.resetForm();
        this.modelService.dismissAll();
        Swal.fire('Done!', 'New item added successfully!', 'success');

      } else {
        console.log('Failed to add new menu item:', response);
        Swal.fire('Error!', 'Failed to add new item. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error while adding new menu item:', error);
      Swal.fire('Error!', 'Failed to add new item. Please try again.', 'error');
    }

  }

  // open update modal
  async openItemUpdateModal(itemUpdateModal: any, menuId: number) {
    this.modelService.open(itemUpdateModal, { size: 'lg', centered: true });
    this.selectedItem = menuId;

    try {
      const data: any = await firstValueFrom(this.api.getMenuItemById(menuId));

      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];

        // form eka patch karanna
        this.itemDetailsForm.patchValue({
          selectedItem: item.id,
          newMenuName: item.name,
          newMenuDescription: item.description,
          newMenuPrice: item.price,
          category: item.categoryId,
        });
      } else {
        // console.warn('No item found for menuId:', menuId);
        Swal.fire('Error!', 'Menu item not found. Please try again.', 'error');
      }

    } catch (error) {
      // console.error('Error while fetching menu item data:', error);
      Swal.fire('Error!', 'Failed to fetch menu item data. Please try again.', 'error');
    }
  }

  // update item
  async updateMenuItem(): Promise<void> {
    const updatedData = this.itemDetailsForm.value;
    const menuId = this.selectedItem;
    try {
      const data = await firstValueFrom(this.api.updateMenuItem(menuId, updatedData));
      if (data?.success) {
        this.loadMenuItems(this.selectedCategoryId);
        this.resetForm();
        this.modelService.dismissAll();
        Swal.fire('Done!', 'Menu item updated successfully!', 'success');
      } else {
        Swal.fire('Error!', 'Failed to update menu item. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error while updating menu item:', error);
    }
  }

  // delete
  deleteMenuItem(menuId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        // Call delete API here
        this.api.deleteMenuItem(menuId).subscribe(response => {
          if (response.success) {
            this.loadMenuItems(this.selectedCategoryId);
            Swal.fire('Deleted!', 'Menu item has been deleted.', 'success');
          } else {
            Swal.fire('Error!', 'Failed to delete menu item. Please try again.', 'error');
          }
        }, error => {
          console.error('Error deleting menu item:', error);
          Swal.fire('Error!', 'Failed to delete menu item. Please try again.', 'error');
        });

        // For now, just simulate deletion
        this.menuDetails = this.menuDetails.filter(item => item.id !== menuId);
        Swal.fire('Deleted!', 'Menu item has been deleted.', 'success');
      }
    });
  }
}