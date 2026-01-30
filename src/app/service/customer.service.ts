import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';
import { Customer } from '../interface/customer.interface';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.baseUrl}/customers`;

  private authHeaders() {
    const token = localStorage.getItem('token');
    if (!token) return {};
    const value = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    return {headers: new HttpHeaders({Authorization: value})}
  }

  getCustomers(): Observable<{message: string, customers: Customer[]}> {
    return this.http.get<{message: string, customers: Customer[]}>(this.baseUrl, this.authHeaders());
  }
}
