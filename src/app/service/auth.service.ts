import { Injectable } from '@angular/core';
import { environment } from '../environment/environment';
import { Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
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
      catchError((error) => {
        if (error.status === 401) {
          throw new Error('Unauthorized: Invalid username or password');
        }
        throw new Error(`Login failed: ${error.status} - ${error.error}`);
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/admin/logout`, {}, {
      headers: {
        'Authorization' : `Bearer ${localStorage.getItem('token')}`
      }
    }).pipe(
      catchError((error) => {
        console.log('logout error', error);
        throw new Error(`Logout failed: ${error.status} - ${error.error}`);
      })
    )
  }

  isAuthencated(): boolean {
    return !!localStorage.getItem('token')
  }

  getAdmin(): Admin | null{
    const adminData = localStorage.getItem('admin');
    return adminData ? JSON.parse(adminData) : null;
  }
}
