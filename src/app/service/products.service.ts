import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Products } from '../interface/product_interface';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.baseUrl}/product`;

  private authHeaders() {
    const token = localStorage.getItem('token');
    if (!token) return {};

    const value = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    return {headers: new HttpHeaders({Authorization: value})}
  }

  //getting all the products
  getProducts(): Observable<Products[]> {
    return this.http.get<{products: Products[]}>(this.baseUrl, this.authHeaders()).pipe(
      map(res => res.products.map(p => ({...p, id: p._id})))
    )
  }

  getProduct(id: string): Observable<Products> {
    return this.http.get<{product: Products}>(`${this.baseUrl}/${id}`, this.authHeaders()).pipe(
      map(res => res.product)
    );
  }

  addProduct(product: Products): Observable<Products> {
    return this.http.post<Products>(this.baseUrl, product, this.authHeaders())
  }

  updateProduct(id: string, product: Products): Observable<Products> {
    return this.http.put<Products>(`${this.baseUrl}/${id}`, product, this.authHeaders())
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, this.authHeaders());
  }
}
