import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';
import { Order } from '../interface/order.interface';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.baseUrl}/orders`;

  getOrders(): Observable<{message: string, orders: Order[]}> {
    return this.http.get<{message: string, orders: Order[]}>(this.baseUrl);
  }

  updateOrderStatus(id: string, status: string): Observable<{message: string, order: Order}> {
    return this.http.put<{message: string, order: Order}>(
      `${this.baseUrl}/${id}/status`, 
      { status }
    );
  }
}
