import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { User } from 'firebase/auth';
import { firstValueFrom, Subject } from 'rxjs';
import { AuthState, AuthService } from '../service/auth.service';
import { AuthGuard, LoginGuard } from './auth.guard';

describe('Firebase route guards', () => {
  let state: Subject<AuthState>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  const loginTree = {} as UrlTree;
  const dashboardTree = {} as UrlTree;

  beforeEach(() => {
    state = new Subject<AuthState>();
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['waitForInitialization']);
    authService.waitForInitialization.and.returnValue(state);
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    router.createUrlTree.and.callFake((commands) =>
      commands[0] === '/login' ? loginTree : dashboardTree
    );
    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        LoginGuard,
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('waits for Firebase initialization before deciding', () => {
    let result: unknown;
    TestBed.inject(AuthGuard).canActivate().subscribe((value) => result = value);

    expect(result).toBeUndefined();
  });

  it('blocks signed-out users from protected routes', async () => {
    const result = firstValueFrom(TestBed.inject(AuthGuard).canActivate());
    state.next({ status: 'signed-out', user: null });
    expect(await result).toBe(loginTree);
  });

  it('allows a restored Firebase session into protected routes', async () => {
    const result = firstValueFrom(TestBed.inject(AuthGuard).canActivate());
    state.next({ status: 'authenticated', user: { uid: 'admin' } as User });
    expect(await result).toBeTrue();
  });

  it('redirects an authenticated user away from login', async () => {
    const result = firstValueFrom(TestBed.inject(LoginGuard).canActivate());
    state.next({ status: 'authenticated', user: { uid: 'admin' } as User });
    expect(await result).toBe(dashboardTree);
  });
});
