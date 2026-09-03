import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CustomerService } from '../../../service/customer.service';
import { Customer } from '../../../interface/customer.interface';
import { OrderService } from '../../../service/order.service';
import { Order } from '../../../interface/order.interface';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-customer-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-details.component.html',
  styleUrl: './customer-details.component.css'
})
export class CustomerDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly customerService = inject(CustomerService);
  private readonly orderService = inject(OrderService);
  
  customer: Customer | null = null;
  customerOrders: Order[] = [];
  customerId = '';
  loading = true;
  loadError = false;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.customerId = id;
      this.fetchCustomer(id);
    } else {
      this.loading = false;
    }
  }

  fetchCustomer(id: string): void {
    this.loading = true;
    this.loadError = false;
    forkJoin({
      customerResponse: this.customerService.getCustomers(),
      orderResponse: this.orderService.getOrders()
    }).subscribe({
      next: ({ customerResponse, orderResponse }) => {
        this.customer = customerResponse.customers.find((customer) => customer._id === id) || null;
        this.customerOrders = orderResponse.orders
          .filter((order) => order.customer?._id === id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.loading = false;
      },
      error: (error: unknown) => {
        console.error(error);
        this.loadError = true;
        this.loading = false;
      }
    });
  }

  get initials(): string {
    if (!this.customer) return '?';
    return `${this.customer.firstName.charAt(0)}${this.customer.lastName.charAt(0)}`.toUpperCase();
  }

  get lifetimeValue(): number {
    return this.customerOrders
      .filter((order) => order.status !== 'cancelled')
      .reduce((total, order) => total + order.totalAmount, 0);
  }

  get lastOrderDate(): string | null {
    return this.customerOrders[0]?.createdAt ?? null;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}
