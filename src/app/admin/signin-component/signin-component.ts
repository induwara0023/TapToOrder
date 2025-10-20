import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-signin-component',
  templateUrl: './signin-component.html',
  styleUrls: ['./signin-component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class SigninComponent {

  signinForm: FormGroup;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
  ) {
    this.signinForm = this.fb.group({
      email: ['induwarasurasinghe1@gmail.com', [Validators.required, Validators.email]],
      password: ['Mashitha@123', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() {
    return this.signinForm.controls;
  }

  async onSubmit() {
    this.submitted = true;
    if (this.signinForm.invalid) return;

    const userLoginDetails = this.signinForm.value;

    try {
      const response = await firstValueFrom(this.api.adminSigin(userLoginDetails));
      console.log('signin response:', response);

      // Determine if login succeeded. Accept multiple shapes.
      const success = response?.success === true || response?.status === 'success' || !!response?.user || !!response?.data;

      if (success) {
        // Try to extract user object and role
        let userObj: any = null;
        if (response.user) userObj = response.user;
        else if (response.data && response.data.user) userObj = response.data.user;
        else if (response.data) userObj = response.data;
        else userObj = response;

        const role = Number(userObj?.role ?? response?.role ?? 0);

        // store a minimal currentUser that RoleGuard expects
        const currentUser = {
          role: role,
          name: userObj?.name ?? userObj?.username ?? userObj?.email ?? '',
          raw: userObj
        };

        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Navigate based on role
        switch (role) {
          case 1: // Admin
            this.router.navigate(['/dashboard']);
            break;
          case 2: // Staff/Chef
            this.router.navigate(['/order-manager']);
            break;
          case 3: // Cashier
            this.router.navigate(['/pos']);
            break;
          default:
            console.warn('Unknown role in signin response, routing to signin');
            this.router.navigate(['/signin']);
        }
      } else {
        console.error('Signin failed:', response?.message ?? response);
        Swal.fire('Login Failed', response?.message || 'Invalid email or password', 'error');
        this.router.navigate(['/signin']);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  }
}
