import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../service/customer.service';
import { Customer } from '../../interface/customer.interface';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  allCustomers: Customer[] = [];
  customers: Customer[] = [];
  loading = true;
  loadError = false;
  searchTerm = '';
  currentPage = 1;
  readonly pageSize = 10;

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.loadError = false;
    this.customerService.getCustomers().subscribe({
      next: (res: {customers: Customer[]}) => {
        this.allCustomers = [...res.customers].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.applyFilter();
        this.loading = false;
      },
      error: (error: unknown) => {
        console.error(error);
        this.loadError = true;
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.customers = this.allCustomers.filter((customer) =>
      !term || `${customer.firstName} ${customer.lastName} ${customer.email} ${customer.phoneNumber}`.toLowerCase().includes(term)
    );
    this.currentPage = 1;
  }

  get paginatedCustomers(): Customer[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.customers.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.customers.length / this.pageSize);
  }

  get visiblePages(): number[] {
    const start = Math.max(1, Math.min(this.currentPage - 1, this.totalPages - 2));
    const end = Math.min(this.totalPages, start + 2);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
  }

  get resultStart(): number {
    return this.customers.length ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get resultEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.customers.length);
  }

  get customersWithAddress(): number {
    return this.allCustomers.filter((customer) => Boolean(customer.address?.trim())).length;
  }

  get recentCustomers(): number {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return this.allCustomers.filter((customer) => new Date(customer.createdAt).getTime() >= thirtyDaysAgo).length;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
