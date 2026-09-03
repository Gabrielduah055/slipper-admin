import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserCredential } from 'firebase/auth';
import {
  BehaviorSubject,
  catchError,
  defer,
  filter,
  finalize,
  from,
  map,
  Observable,
  of,
  shareReplay,
  take,
  tap
} from 'rxjs';
import { FirebaseAuthClient } from '../firebase/firebase-auth.client';
import { AuthNotificationService } from './auth-notification.service';

export type AuthState =
  | { status: 'initializing'; user: null }
  | { status: 'authenticated'; user: User }
  | { status: 'signed-out'; user: null };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly firebase = inject(FirebaseAuthClient);
  private readonly router = inject(Router);
  private readonly notifications = inject(AuthNotificationService);
  private readonly stateSubject = new BehaviorSubject<AuthState>({
    status: 'initializing',
    user: null
  });
  private termination$: Observable<void> | null = null;

  readonly authState$ = this.stateSubject.asObservable();
  readonly initialized$ = this.authState$.pipe(
    map((state) => state.status !== 'initializing')
  );
  readonly authenticated$ = this.authState$.pipe(
    map((state) => state.status === 'authenticated')
  );
  readonly user$ = this.authState$.pipe(map((state) => state.user));

  constructor() {
    this.clearLegacyState();
    this.firebase.observeAuthState(
      (user) => {
        this.stateSubject.next(
          user
            ? { status: 'authenticated', user }
            : { status: 'signed-out', user: null }
        );
      },
      () => {
        this.stateSubject.next({ status: 'signed-out', user: null });
        this.notifications.show('Unable to restore your session. Please sign in again.');
      }
    );
  }

  get currentUser(): User | null {
    return this.firebase.currentUser;
  }

  get isAuthenticated(): boolean {
    return this.stateSubject.value.status === 'authenticated';
  }

  waitForInitialization(): Observable<AuthState> {
    return this.authState$.pipe(
      filter((state) => state.status !== 'initializing'),
      take(1)
    );
  }

  login(credentials: { email: string; password: string }): Observable<UserCredential> {
    return defer(() => from(this.firebase.signIn(credentials.email, credentials.password))).pipe(
      tap(() => this.clearLegacyState())
    );
  }

  getIdToken(forceRefresh = false): Observable<string> {
    return defer(() => from(this.firebase.getIdToken(forceRefresh)));
  }

  logout(): Observable<void> {
    return defer(() => from(this.firebase.signOut())).pipe(
      finalize(() => this.clearLegacyState())
    );
  }

  endSession(message: string): Observable<void> {
    if (this.termination$) {
      return this.termination$;
    }

    this.clearLegacyState();
    this.notifications.show(message);
    this.termination$ = defer(() => from(this.firebase.signOut())).pipe(
      catchError(() => of(undefined)),
      tap(() => this.stateSubject.next({ status: 'signed-out', user: null })),
      map(() => undefined),
      tap(() => void this.router.navigate(['/login'])),
      finalize(() => {
        this.termination$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.termination$;
  }

  clearLegacyState(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('admin');
  }
}
