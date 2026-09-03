import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../service/order.service';
import { Order } from '../../interface/order.interface';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  allOrders: Order[] = [];
  orders: Order[] = [];
  loading = true;
  loadError = false;
  searchTerm = '';
  selectedStatus = 'All statuses';
  currentPage = 1;
  readonly pageSize = 10;

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.loadError = false;
    this.orderService.getOrders().subscribe({
      next: (res: {orders: Order[]}) => {
        this.allOrders = [...res.orders].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.applyFilters();
        this.loading = false;
      },
      error: (error: unknown) => {
        console.error(error);
        this.loadError = true;
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.orders = this.allOrders.filter((order) => {
      const customer = `${order.customer?.firstName ?? ''} ${order.customer?.lastName ?? ''} ${order.customer?.email ?? ''}`.toLowerCase();
      const matchesSearch = !term || order._id.toLowerCase().includes(term.replace('#', '')) || customer.includes(term);
      const matchesStatus = this.selectedStatus === 'All statuses' || order.status === this.selectedStatus;
      return matchesSearch && matchesStatus;
    });
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'All statuses';
    this.applyFilters();
  }

  get paginatedOrders(): Order[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.orders.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.orders.length / this.pageSize);
  }

  get visiblePages(): number[] {
    const start = Math.max(1, Math.min(this.currentPage - 1, this.totalPages - 2));
    const end = Math.min(this.totalPages, start + 2);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
  }

  get resultStart(): number {
    return this.orders.length ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get resultEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.orders.length);
  }

  get openOrders(): number {
    return this.allOrders.filter((order) => ['pending', 'processing', 'paid'].includes(order.status)).length;
  }

  get shippedOrders(): number {
    return this.allOrders.filter((order) => order.status === 'shipped').length;
  }

  get deliveredOrders(): number {
    return this.allOrders.filter((order) => order.status === 'delivered').length;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'paid': return 'status-paid';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-neutral';
    }
  }
}
