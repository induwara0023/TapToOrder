import { Routes } from '@angular/router';
import { MenuComponent } from './pages/menu-component/menu-component';
import { HeaderComponent } from './pages/header-component/header-component';
import { CartComponent } from './pages/cart-component/cart-component';
import { DashboardComponent } from './admin/dashboard-component/dashboard-component';
import { MenumanageComponent } from './admin/menumanage-component/menumanage-component';
import { TablemanageComponent } from './admin/tablemanage-component/tablemanage-component';
import { UsermanagerComponent } from './admin/usermanager-component/usermanager-component';
import { NfcGuard } from './guards/nfc-guard';
import { CustomerorderstatusComponent } from './pages/customerorderstatus-component/customerorderstatus-component';
import { HomeComponent } from './pages/home-component/home-component';
import { OrdermanageComponent } from './admin/ordermanage-component/ordermanage-component';
import { BillingComponent } from './admin/billing-component/billing-component';
import { PosComponent } from './admin/pos-component/pos-component';
import { SigninComponent } from './admin/signin-component/signin-component';
import { RoleGuard } from './guards/RoleGuard';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'menu', component: MenuComponent, canActivate: [NfcGuard], data: { allowTId: true } },
    // { path: 'menu', component: MenuComponent},
    { path: 'signin', component:SigninComponent },
    { path: 'home', component: HomeComponent },
    { path: 'header', component: HeaderComponent },
    { path: 'cart', component: CartComponent },
    { path: 'orderstatus', component: CustomerorderstatusComponent},
    { path: 'customerorderstatus', component: CustomerorderstatusComponent},
    // admin (protected - only role 1 allowed)
    // Dashboard: only admin
    { path: 'dashboard', component: DashboardComponent, canActivate: [RoleGuard], data: { roles: [1] } },
    // POS: admin + cashier
    { path: 'pos', component: PosComponent, canActivate: [RoleGuard], data: { roles: [1, 3] } },
    // Billing: admin + cashier
    { path: 'billing', component: BillingComponent, canActivate: [RoleGuard], data: { roles: [1, 3] } },
    // Menu manager: only admin
    { path: 'menu-manager', component: MenumanageComponent, canActivate: [RoleGuard], data: { roles: [1] } },
    // Table manager: only admin
    { path: 'table-manager', component: TablemanageComponent, canActivate: [RoleGuard], data: { roles: [1] } },
    // Order manager: admin + staff + cashier (all who need order management)
    { path: 'order-manager', component: OrdermanageComponent, canActivate: [RoleGuard], data: { roles: [1, 2, 3] } },
    // User manager: only admin
    { path: 'user-manager', component: UsermanagerComponent, canActivate: [RoleGuard], data: { roles: [1] } }
];
