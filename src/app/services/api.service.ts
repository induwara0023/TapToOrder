import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  private apiUrl = 'http://localhost/taptoorder-backend';

  constructor(@Inject(HttpClient) private http: HttpClient) { }

  getCategories(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getCategories.php`);
  }

  addNewCategory(categoryName: string): Observable<any> {
    const body = { categoryName: categoryName };
    return this.http.post<any>(`${this.apiUrl}/addNewCategory.php`, body);
  }

  // menu management page APIs
  addNewMenuItem(newItemData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/addNewMenu.php`, newItemData);
  }

  getMenuItems(menuId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getMenu.php`)
  }

  getMenuItemsByCategory(categoryId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getMenu.php?cat_id=${categoryId}`);
  }

  getMenuItemById(menuId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getMenuById.php?id=${menuId}`);
  }

  updateMenuItem(menuId: number, updatedData: any): Observable<any> {
    const body = { id: menuId, updatedData };
    return this.http.post<any>(`${this.apiUrl}/updateMenu.php`, body);
  }

  deleteMenuItem(menuId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/deleteMenu.php`, { id: menuId });
  }

  // table manage page APIs
  getTables(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getTables.php`);
  }

  addNewTable(newTableData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/addNewTable.php`, newTableData);
  }

  updateTable(updatedTableData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/updateTable.php`, updatedTableData);
  }

  deleteTable(tableId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/deleteTable.php`, { tableId });
  }

  // user management APIs
  getUserRoles(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getUserRoles.php`);
  }

  addUser(newUserData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/addUser.php`, newUserData);
  }

  getUsers(selectedUserRole: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getUsers.php?role_id=${selectedUserRole}`);
  }

  updateUser(userId: number, updatedData: any): Observable<any> {
    const body = { id: userId, updatedData };
    return this.http.post<any>(`${this.apiUrl}/updateUser.php`, body);
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/deleteUser.php`, { id: userId });
  }

  // cart page APIs
  placeOrder(cartItems: any, tableId: String | null): Observable<any> {
    const body = { cartItems, tableId };
    return this.http.post<any>(`${this.apiUrl}/placeOrder.php`, body);
  }

  // order status page APIs
  getOrderDetailsByTableId(tableId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getOrderByTable.php?tableId=${tableId}`);
  }

  requestBill(tableId: string | null, sessionId: string | null): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/requestBill.php`, { tableId, sessionId });
  }

  // signin
  adminSigin(userLoginDetails:any):Observable<any>{
    return this.http.post<any>(`${this.apiUrl}/adminSignin.php`,userLoginDetails);
  }

  // Validate a server-issued session token (from QR/NFC)
  // validateSessionToken(sessionToken: string): Observable<any> {
  //   return this.http.post<any>(`${this.apiUrl}/validateSession.php`, { session: sessionToken });
  // }

  // dashBoard
  getDashboardCounts() {
    return this.http.get<any>(`${this.apiUrl}/getDashboardCounts.php`);
  }

  getMostSellingItems(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getMostSellingItems.php`);
  }

  // order-manage page API
  getOrderStatus(): Promise<any> {
    return this.http.get<any>(`${this.apiUrl}/getOrderStatus.php`).toPromise();
  }

  getOrderDetails(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getOrderDetails.php`);
  }

  updateOrderStatus(orderId: number, statusId: number): Observable<any> {
    const body = { orderId, statusId };
    return this.http.post<any>(`${this.apiUrl}/updateOrderStatus.php`, body);
  }

  // billing page
  requestFinalBill(tableId?: number|string|null, sessionId?: number|null, grossAmount?: number, serviceCharge?: number) {
    const body = { tableId, sessionId, grossAmount, serviceCharge };
    return this.http.post<any>(`${this.apiUrl}/finalBill.php`, body);
  }


  // getOrdersByStatus(status: string, sessionId: number): Promise<any> {
  //   return this.http.get<any>(`${this.apiUrl}/getOrdersByStatus.php?status=${status}&sessionId=${sessionId}`).toPromise();
  // }


}
