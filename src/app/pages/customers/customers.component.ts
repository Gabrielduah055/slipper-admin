import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CustomerService } from '../../service/customer.service';
import { Customer } from '../../interface/customer.interface';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent implements OnInit {
  customerService = inject(CustomerService);
  customers: Customer[] = [];
  loading = true;

  ngOnInit() {
    this.customerService.getCustomers().subscribe({
      next: (res: {customers: Customer[]}) => {
        this.customers = res.customers;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
      }
    });
  }
}
