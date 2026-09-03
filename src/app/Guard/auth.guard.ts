import { inject, Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AuthService } from '../service/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.waitForInitialization().pipe(
      map((state) => state.status === 'authenticated'
        ? true
        : this.router.createUrlTree(['/login']))
    );
  }
}

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.waitForInitialization().pipe(
      map((state) => state.status === 'authenticated'
        ? this.router.createUrlTree(['/dashboard'])
        : true)
    );
  }
}
