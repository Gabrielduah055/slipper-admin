import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CustomerService } from '../../../service/customer.service';
import { Customer } from '../../../interface/customer.interface';

@Component({
  selector: 'app-customer-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-details.component.html',
  styleUrl: './customer-details.component.css'
})
export class CustomerDetailsComponent implements OnInit {
  route = inject(ActivatedRoute);
  customerService = inject(CustomerService);
  
  customer: Customer | null = null;
  loading = true;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchCustomer(id);
    }
  }

  fetchCustomer(id: string) {
    this.customerService.getCustomers().subscribe({
      next: (res: {customers: Customer[]}) => {
        this.customer = res.customers.find((c: Customer) => c._id === id) || null;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
      }
    });
  }
}
