import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../service/order.service';
import { CustomerService } from '../../service/customer.service';
import { ProductsService } from '../../service/products.service';
import { Order } from '../../interface/order.interface';
import { Customer } from '../../interface/customer.interface';
import { Products } from '../../interface/product_interface';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  orderService = inject(OrderService);
  customerService = inject(CustomerService);
  productService = inject(ProductsService);

  // Stats
  totalRevenue = 0;
  totalOrders = 0;
  totalCustomers = 0;
  totalProducts = 0;

  // Lists
  recentOrders: Order[] = [];
  topProducts: { product: Products, count: number }[] = [];
  
  loading = true;

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    // We need to fetch all data to calculate stats
    // In a real app, the backend should provide a /stats endpoint
    
    // 1. Fetch Orders
    this.orderService.getOrders().subscribe({
      next: (res: {orders: Order[]}) => {
        const orders = res.orders;
        this.totalOrders = orders.length;
        
        // Calculate Revenue (only from non-cancelled orders)
        this.totalRevenue = orders
          .filter(o => o.status !== 'cancelled')
          .reduce((acc, curr) => acc + curr.totalAmount, 0);

        // Recent Orders
        this.recentOrders = [...orders].slice(0, 5);

        // Calculate Top Products (Need products first to match details)
        this.fetchProducts(orders);
      },
      error: (err: any) => console.error('Error fetching orders:', err)
    });

    // 2. Fetch Customers
    this.customerService.getCustomers().subscribe({
      next: (res: {customers: Customer[]}) => {
        this.totalCustomers = res.customers.length;
      },
      error: (err: any) => console.error('Error fetching customers:', err)
    });
  }

  fetchProducts(orders: Order[]) {
    this.productService.getProducts().subscribe({
      next: (products: Products[]) => {
        this.totalProducts = products.length;
        this.calculateTopProducts(orders, products);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error fetching products:', err);
        this.loading = false;
      }
    });
  }

  calculateTopProducts(orders: Order[], products: Products[]) {
    const productSales = new Map<string, number>();

    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        order.items.forEach(item => {
          const productId = typeof item.product === 'string' ? item.product : item.product._id;
          if (productId) {
             const current = productSales.get(productId) || 0;
             productSales.set(productId, current + item.quantity);
          }
        });
      }
    });

    // Sort by count and take top 5
    const topIds = [...productSales.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    this.topProducts = topIds.map(([id, count]) => {
      const product = products.find(p => p._id === id);
      return product ? { product, count } : null;
    }).filter(item => item !== null) as { product: Products, count: number }[];
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
