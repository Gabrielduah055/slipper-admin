import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../service/order.service';
import { CustomerService } from '../../service/customer.service';
import { ProductsService } from '../../service/products.service';
import { Order } from '../../interface/order.interface';
import { Products } from '../../interface/product_interface';
import { finalize, forkJoin } from 'rxjs';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductsService);

  // Stats
  totalRevenue = 0;
  totalOrders = 0;
  totalCustomers = 0;
  totalProducts = 0;
  pendingOrders = 0;
  lowStockProducts = 0;
  outOfStockProducts = 0;
  averageOrderValue = 0;
  fulfilledRate = 0;

  // Lists
  recentOrders: Order[] = [];
  topProducts: { product: Products, count: number }[] = [];
  
  loading = true;
  loadError = false;
  readonly today = new Date();

  ngOnInit() {
    this.fetchData();
  }

  fetchData(): void {
    this.loading = true;
    this.loadError = false;

    forkJoin({
      orderResponse: this.orderService.getOrders(),
      customerResponse: this.customerService.getCustomers(),
      products: this.productService.getProducts()
    }).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: ({ orderResponse, customerResponse, products }) => {
        const orders = orderResponse.orders;
        const completedOrders = orders.filter((order) => order.status !== 'cancelled');

        this.totalOrders = orders.length;
        this.totalCustomers = customerResponse.customers.length;
        this.totalProducts = products.length;
        this.totalRevenue = completedOrders.reduce((total, order) => total + order.totalAmount, 0);
        this.averageOrderValue = completedOrders.length > 0 ? this.totalRevenue / completedOrders.length : 0;
        this.pendingOrders = orders.filter((order) => ['pending', 'processing', 'paid'].includes(order.status)).length;
        this.lowStockProducts = products.filter((product) => product.productStock > 0 && product.productStock <= 5).length;
        this.outOfStockProducts = products.filter((product) => product.productStock === 0).length;
        this.fulfilledRate = completedOrders.length > 0
          ? Math.round((orders.filter((order) => order.status === 'delivered').length / completedOrders.length) * 100)
          : 0;
        this.recentOrders = [...orders]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        this.calculateTopProducts(orders, products);
      },
      error: (error: unknown) => {
        console.error('Error loading dashboard:', error);
        this.loadError = true;
      }
    });
  }

  calculateTopProducts(orders: Order[], products: Products[]): void {
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
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-violet-100 text-violet-800';
      case 'shipped': return 'bg-cyan-100 text-cyan-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
