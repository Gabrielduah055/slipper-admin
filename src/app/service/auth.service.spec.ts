import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { User, UserCredential } from 'firebase/auth';
import { firstValueFrom } from 'rxjs';
import { FirebaseAuthClient } from '../firebase/firebase-auth.client';
import { AuthNotificationService } from './auth-notification.service';
import { AuthService } from './auth.service';

class FirebaseAuthClientStub {
  currentUser: User | null = null;
  readonly signIn = jasmine.createSpy('signIn').and.resolveTo({} as UserCredential);
  readonly signOut = jasmine.createSpy('signOut').and.resolveTo();
  readonly getIdToken = jasmine.createSpy('getIdToken').and.resolveTo('firebase-token');
  private nextState: ((user: User | null) => void) | null = null;

  observeAuthState(next: (user: User | null) => void): () => void {
    this.nextState = next;
    return () => undefined;
  }

  emit(user: User | null): void {
    this.currentUser = user;
    this.nextState?.(user);
  }
}

describe('AuthService', () => {
  let service: AuthService;
  let firebase: FirebaseAuthClientStub;

  beforeEach(() => {
    firebase = new FirebaseAuthClientStub();
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuthNotificationService,
        { provide: FirebaseAuthClient, useValue: firebase },
        { provide: Router, useValue: router }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('signs in with Firebase and never stores a custom JWT', async () => {
    localStorage.setItem('token', 'legacy');

    await firstValueFrom(service.login({ email: 'admin@example.com', password: 'secret' }));

    expect(firebase.signIn).toHaveBeenCalledWith('admin@example.com', 'secret');
    expect(localStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  it('exposes a restored Firebase user after initialization', async () => {
    const user = { uid: 'admin' } as User;
    const ready = firstValueFrom(service.waitForInitialization());

    firebase.emit(user);

    expect(await ready).toEqual({ status: 'authenticated', user });
    expect(service.isAuthenticated).toBeTrue();
  });

  it('logs out through Firebase and clears legacy state', async () => {
    localStorage.setItem('admin', '{"id":"legacy"}');

    await firstValueFrom(service.logout());

    expect(firebase.signOut).toHaveBeenCalled();
    expect(localStorage.getItem('admin')).toBeNull();
  });
});
