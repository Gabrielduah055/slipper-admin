import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { ProductsComponent } from './pages/products/products.component';
import { ProductDetailsComponent } from './pages/products/product-details/product-details.component';
import { AddProductComponent } from './pages/products/add-product/add-product.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { OrderDetailsComponent } from './pages/orders/order-details/order-details.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { CustomerDetailsComponent } from './pages/customers/customer-details/customer-details.component';
import { AuthGuard } from './Guard/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    
    {
        path: '',
        component: HomeComponent,
        canActivate: [AuthGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: DashboardComponent },
            { path: 'products', component: ProductsComponent },
            { path: 'products/add', component: AddProductComponent },
            { path: 'products/:id', component: ProductDetailsComponent },
            { path: 'orders', component: OrdersComponent },
            { path: 'orders/:id', component: OrderDetailsComponent },
            { path: 'customers/:id', component: CustomerDetailsComponent },
            { path: 'customers', component: CustomersComponent }
        ]
    }
];
