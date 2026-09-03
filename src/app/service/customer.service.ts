import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';
import { Customer } from '../interface/customer.interface';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.baseUrl}/customers`;

  getCustomers(): Observable<{message: string, customers: Customer[]}> {
    return this.http.get<{message: string, customers: Customer[]}>(this.baseUrl);
  }
}
