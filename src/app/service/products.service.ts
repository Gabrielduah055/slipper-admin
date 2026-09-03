import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Products } from '../interface/product_interface';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.baseUrl}/product`;

  //getting all the products
  getProducts(): Observable<Products[]> {
    return this.http.get<{products: Products[]}>(this.baseUrl).pipe(
      map(res => res.products.map(p => ({...p, id: p._id})))
    )
  }

  getProduct(id: string): Observable<Products> {
    return this.http.get<{product: Products}>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.product)
    );
  }

  addProduct(product: FormData): Observable<Products> {
    return this.http.post<Products>(this.baseUrl, product)
  }

  updateProduct(id: string, product: Products | FormData): Observable<Products> {
    return this.http.put<Products>(`${this.baseUrl}/${id}`, product)
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getCategories(): Observable<string[]> {
    return this.http.get<{ message: String; categories: string[] }>
   (
      `${this.baseUrl}/categories`).pipe(
        map(res => res.categories)
  )}
}
