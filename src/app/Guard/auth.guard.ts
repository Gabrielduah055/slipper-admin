import { Injectable } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot, ActivatedRouteSnapshot, GuardResult, MaybeAsync } from '@angular/router';

@Injectable({
    providedIn: 'root'
})

export class AuthGuard implements CanActivate {
    constructor(private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):boolean{
        const token = localStorage.getItem('token');
    


        //loading home page when the token isn't present
        if (!token) {
            this.router.navigate(['/login']);
            return false;
        }

        //if token isn't present
        if (state.url === '/login' && token) {
            this.router.navigate(['/dashboard']);
            return false;
        }

        try {
            return true;
        } catch (error) {
            localStorage.removeItem('token');
            this.router.navigate(['/login']);
            return false;
        }
    }
}