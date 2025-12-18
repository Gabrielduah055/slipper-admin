import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../service/auth.service';

@Component({
    selector: 'app-sidebar',
    imports: [RouterLink, RouterLinkActive, CommonModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

    private authService = inject(AuthService);
    private router = inject(Router)

    onLogout() {

        const confirmed = confirm('Are you sure you want to logout?');

        if (confirmed) {
            this.authService.logout();
            this.router.navigate(['/login']);
        }
    }

    get isAuthenticated(): boolean {
        return this.authService.isAuthencated();
    }

}
