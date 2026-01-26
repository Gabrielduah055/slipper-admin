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

  private authHeadersForFormData() {
    const token = localStorage.getItem('token');
    if (!token) return {};

    const value = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    // For FormData, only set Authorization header, let browser set Content-Type with boundary
    return {
      headers: new HttpHeaders({
        Authorization: value
        // Don't set Content-Type - browser will set it automatically with boundary for FormData
      })
    }
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

  addProduct(product: FormData): Observable<Products> {
    return this.http.post<Products>(this.baseUrl, product, this.authHeadersForFormData())
  }

  updateProduct(id: string, product: Products | FormData): Observable<Products> {
    // Use different headers for FormData vs JSON
    const headers = product instanceof FormData 
      ? this.authHeadersForFormData() 
      : this.authHeaders();
    return this.http.put<Products>(`${this.baseUrl}/${id}`, product, headers)
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, this.authHeaders());
  }

  getCategories(): Observable<string[]> {
    return this.http.get<{ message: String; categories: string[] }>
   (
      `${this.baseUrl}/categories`, this.authHeaders()).pipe(
        map(res => res.categories)
  )}
}
