import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { AdminHeader } from '../admin-header/admin-header';
import { Sidebar } from '../sidebar/sidebar';
import { ApiService } from '../../services/api.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-usermanager-component',
  imports: [AdminHeader, ReactiveFormsModule, CommonModule, FormsModule, RouterOutlet, Sidebar],
  templateUrl: './usermanager-component.html',
  styleUrls: ['./usermanager-component.css'],
})
export class UsermanagerComponent implements OnInit {
  addUserModal: any;
  addNewUserForm!: FormGroup;
  userRoles: any[] = [];
  userList: any[] = [];
  isSubmitting = false;
  selectedUserRole: number = 0;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private zone: NgZone
  ) { }

  ngOnInit() {
    this.initForm();
    this.getUserRoles();
    this.loadUserData(this.selectedUserRole);
  }

  // Initialize form
  initForm() {
    this.addNewUserForm = this.fb.group({
      newUserName: ['', [Validators.required]],
      newUserRole: [1, [Validators.required]],
      newUserMobile: ['', [Validators.required]],
      newUserEmail: ['', [Validators.required, Validators.email]],
      newUserPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  // Reset form
  resetForm() {
    this.initForm();
    this.isSubmitting = false;
    setTimeout(() => this.cdr.detectChanges());
  }

  // Get user roles
  async getUserRoles() {
    try {
      const data = await firstValueFrom(this.api.getUserRoles());
      if (data?.success) {
        this.userRoles = data.data;
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }
  }

  // Open modal
  openAddUserModal(addUserModal: any) {
    this.modalService.open(addUserModal, { size: 'lg', centered: true });
  }

  // Load user data
  async loadUserData(selectedUserRole: number): Promise<void> {
    try {
      const data: any = await firstValueFrom(this.api.getUsers(selectedUserRole));
      if (data && Array.isArray(data)) {
        this.userList = data;
        this.cdr.detectChanges();
      } else if (data && Array.isArray(data.userList)) {
        this.userList = data.userList;
        this.cdr.detectChanges();
      } else {
        this.userList = [];
        this.cdr.detectChanges();
      }
      setTimeout(() => this.cdr.detectChanges());
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  // Add user
  async addUser() {
    if (this.addNewUserForm.get('newUserRole')?.value === 0) {
      Swal.fire('Error!', 'Please select a valid user role', 'error');
      return;
    }

    if (!this.addNewUserForm.valid) {
      Swal.fire('Error!', 'Please fill all required fields', 'error');
      return;
    }

    this.isSubmitting = true;
    this.cdr.detectChanges();

    const newUserData = this.addNewUserForm.value;

    try {
      const response = await firstValueFrom(this.api.addUser(newUserData));

      if (response?.success) {
        // Just reload the data - simple and reliable
        
        await this.loadUserData(this.selectedUserRole);
        this.userList.unshift(response.user);
        this.resetForm();
        this.modalService.dismissAll();
        Swal.fire('Success!', 'User added successfully', 'success');

        setTimeout(() => {
          window.location.reload();
        }, 2000);

      } else {
        Swal.fire('Error!', response?.message || 'Failed to add user', 'error');
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error adding user:', error);
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }
}