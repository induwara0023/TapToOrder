import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: any) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // If not running in a browser (e.g., server-side rendering), allow activation
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    // Get user data from localStorage (string or null). Access only in browser.
    let userStr = '';
    try {
      userStr = (localStorage && localStorage.getItem) ? (localStorage.getItem('currentUser') ?? '') : '';
    } catch (e) {
      userStr = '';
    }

    if (!userStr) {
      // Not logged in
      this.router.navigate(['/signin']);
      return false;
    }

    // Parse user object
    let user: any = null;
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      this.router.navigate(['/signin']);
      return false;
    }

    // Extract user role (assumed number)
    const role = user && user.role;

    // Allowed roles for this route
    const allowedRoles = route.data['roles'] as number[];

    if (allowedRoles && allowedRoles.indexOf(role) === -1) {
      // Role not authorized
      this.router.navigate(['/signin']);
      return false;
    }

    // Authorized
    return true;
  }
}
