import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { User } from 'firebase/auth';
import { AuthService } from '../../service/auth.service';
import { AuthNotificationService } from '../../service/auth-notification.service';

@Component({
    selector: 'app-sidebar',
    imports: [RouterLink, RouterLinkActive, CommonModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

    private readonly authService = inject(AuthService);
    private readonly notifications = inject(AuthNotificationService);
    private readonly router = inject(Router);
    readonly user$ = this.authService.user$;
    avatarFailed = false;

    onLogout(): void {

        const confirmed = confirm('Are you sure you want to logout?');

        if (confirmed) {
            this.authService.logout().subscribe({
                next: () => void this.router.navigate(['/login']),
                error: () => this.notifications.show('Unable to sign out. Please try again.')
            });
        }
    }

    get isAuthenticated(): boolean {
        return this.authService.isAuthenticated;
    }

    displayName(user: User): string {
        const googleProfile = user.providerData.find((profile) => profile.providerId === 'google.com');
        const profileName = user.displayName || googleProfile?.displayName;

        if (profileName?.trim()) {
            return profileName;
        }

        const emailName = user.email?.split('@')[0] ?? 'Administrator';
        return emailName
            .split(/[._-]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }

    profilePhoto(user: User): string | null {
        return user.photoURL
            || user.providerData.find((profile) => profile.providerId === 'google.com')?.photoURL
            || null;
    }

    initials(user: User): string {
        return this.displayName(user)
            .split(' ')
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('');
    }

    onAvatarError(): void {
        this.avatarFailed = true;
    }

}
