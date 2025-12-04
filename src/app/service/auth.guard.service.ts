import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';



@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state:RouterStateSnapshot
  ): boolean | Observable<boolean> | Promise<boolean> {
    if (this.authService.isAuthencated()) {
      return true;
    }

    //clear browser history
    window.history.pushState(null, '', window.location.pathname);
    window.history.pushState(null, '', window.location.pathname);

    //redirect to login page
    this.router.navigate(['/login']);
    return false;

  }
}
