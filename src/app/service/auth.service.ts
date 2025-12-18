import { Injectable } from '@angular/core';
import { environment } from '../environment/environment';
import { Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable,tap } from 'rxjs';
import { Admin, login } from '../interface/auth_interface';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    @Inject(HttpClient)
    private http:HttpClient
  ) { }

  private baseUrl = environment.baseUrl;

  login(credentials: { userName: string, password: string }): Observable<login> {
    return this.http.post<login>(`${this.baseUrl}/admin/login`, credentials).pipe(
      tap((res) => {
        if (res && (res as any).token) {
          localStorage.setItem('token', (res as any).token);
        }
        if (res && (res as any).admin) {
          localStorage.setItem('admin', JSON.stringify((res as any).admin))
        }
      }),
      catchError((error) => {
        if (error.status === 401) {
          throw new Error('Unauthorized: Invalid username or password');
        }
        throw new Error(`Login failed: ${error.status} - ${error.error}`);
      })
    );
  }

  logout(): void {
   localStorage.removeItem('token');
   localStorage.removeItem('admin');
 }

  isAuthencated(): boolean {
    return !!localStorage.getItem('token')
  }

  getAdmin(): Admin | null{
    const adminData = localStorage.getItem('admin');
    return adminData ? JSON.parse(adminData) : null;
  }
}
