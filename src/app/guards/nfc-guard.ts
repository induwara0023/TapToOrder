import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NfcGuard implements CanActivate {

  constructor(private router: Router, private api: ApiService) { }

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean> {

    // accept multiple possible query param names that NFC/QR systems might use
    const possibleKeys = ['tId', 'tid', 'table', 'tableId', 'table_id', 'id'];
    const qp = route.queryParamMap;
    const table = qp.get('table') || qp.get('tableName') || null;
    let tableId: string | null = null;
    for (const k of possibleKeys) {
      const v = qp.get(k);
      if (v) { tableId = v; break; }
    }
    const forceNew = qp.get('new') || qp.get('fresh') || null;

    // max session age (ms) - adjust as needed (e.g., 6 hours)
    const MAX_SESSION_AGE = 6 * 60 * 60 * 1000;

    // If tId present in URL (user arrived via QR/NFC), create a short-lived session
    // If the query param `new=1` is present we treat this as a request to start a fresh order
    if (tableId) {
      try {
        const session = {
          tId: tableId,
          tableName: table || null,
          verifiedAt: Date.now(),
          // a small client nonce to mark this session (not secure server-side)
          nonce: Math.random().toString(36).slice(2)
        };
        localStorage.setItem('tableSession', JSON.stringify(session));
      } catch (e) {
        // ignore storage errors
      }

      // if `new` query param present, skip the existing-order redirect and allow a fresh menu
      if (forceNew && (forceNew === '1' || forceNew === 'true')) {
        return true;
      }

      // Otherwise, if there is an existing order for this table, redirect to order status page
      try {
        const resp: any = await firstValueFrom(this.api.getOrderDetailsByTableId(tableId));
        // backend returns { message: [...] } when order details exist (see customerorderstatus component)
        if (resp && Array.isArray(resp.message) && resp.message.length > 0) {
          // redirect to customer order status view with the table id
          this.router.navigate(['/customerorderstatus'], { queryParams: { tId: tableId } });
          return false;
        }
      } catch (err) {
        // if API fails, allow user to continue to menu (fallback)
        console.warn('Failed to check existing orders:', err);
      }

      return true;
    }

    // No tId in URL → require a previously created valid session
    try {
      const raw = localStorage.getItem('tableSession');
      if (!raw) {
        // No session found — block access
        this.router.navigate(['/signin']);
        return false;
      }

      const session = JSON.parse(raw);
      if (!session || !session.verifiedAt) {
        localStorage.removeItem('tableSession');
        this.router.navigate(['/signin']);
        return false;
      }

      // session expired?
      if (Date.now() - Number(session.verifiedAt) > MAX_SESSION_AGE) {
        localStorage.removeItem('tableSession');
        this.router.navigate(['/signin']);
        return false;
      }

      // session is valid — but check for existing orders and redirect if present
      try {
        const sessionTId = session.tId;
        if (sessionTId) {
          const resp: any = await firstValueFrom(this.api.getOrderDetailsByTableId(sessionTId));
          if (resp && Array.isArray(resp.message) && resp.message.length > 0) {
            this.router.navigate(['/customerorderstatus'], { queryParams: { tId: sessionTId } });
            return false;
          }
        }
      } catch (err) {
        // ignore API errors and proceed
        console.warn('Failed to check existing orders for session:', err);
      }

      return true;
    } catch (err) {
      // malformed session or error → clear and redirect
      try { localStorage.removeItem('tableSession'); } catch (e) { }
      this.router.navigate(['/signin']);
      return false;
    }
  }
}
