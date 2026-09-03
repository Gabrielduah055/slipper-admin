import {
  HttpErrorResponse,
  HttpHandler,
  HttpHeaders,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { User } from 'firebase/auth';
import { Observable, of, Subject, throwError } from 'rxjs';
import { environment } from '../environment/environment';
import { AuthService } from '../service/auth.service';
import { AuthInterceptor } from './authInterceptor';

describe('AuthInterceptor', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let interceptor: AuthInterceptor;
  const backendUrl = `${environment.baseUrl}/orders`;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['getIdToken', 'endSession'],
      { currentUser: { uid: 'admin' } as User }
    );
    authService.getIdToken.and.returnValue(of('firebase-token'));
    authService.endSession.and.returnValue(of(undefined));
    interceptor = new AuthInterceptor(authService);
  });

  it('attaches a Firebase token to backend requests and preserves headers', () => {
    let handled: HttpRequest<unknown> | undefined;
    const next = {
      handle: (request: HttpRequest<unknown>) => {
        handled = request;
        return of(new HttpResponse({ status: 200 }));
      }
    } as HttpHandler;
    const request = new HttpRequest('GET', backendUrl, undefined, {
      headers: new HttpHeaders({ 'X-Correlation-Id': 'abc' })
    });

    interceptor.intercept(request, next).subscribe();

    expect(handled?.headers.get('Authorization')).toBe('Bearer firebase-token');
    expect(handled?.headers.get('X-Correlation-Id')).toBe('abc');
  });

  it('does not attach tokens to external or Firebase authentication URLs', () => {
    const urls = [
      'https://example.com/image.png',
      'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword'
    ];
    const handled: HttpRequest<unknown>[] = [];
    const next = {
      handle: (request: HttpRequest<unknown>) => {
        handled.push(request);
        return of(new HttpResponse({ status: 200 }));
      }
    } as HttpHandler;

    urls.forEach((url) => interceptor.intercept(new HttpRequest('GET', url), next).subscribe());

    expect(authService.getIdToken).not.toHaveBeenCalled();
    expect(handled.every((request) => !request.headers.has('Authorization'))).toBeTrue();
  });

  it('refreshes once and retries once after a 401', () => {
    let attempts = 0;
    authService.getIdToken.and.callFake((forceRefresh = false) =>
      of(forceRefresh ? 'refreshed-token' : 'firebase-token')
    );
    const next = {
      handle: (request: HttpRequest<unknown>): Observable<HttpResponse<unknown>> => {
        attempts += 1;
        return attempts === 1
          ? throwError(() => new HttpErrorResponse({ status: 401 }))
          : of(new HttpResponse({ status: 200, body: request.headers.get('Authorization') }));
      }
    } as HttpHandler;
    let response: HttpResponse<unknown> | undefined;

    interceptor.intercept(new HttpRequest('GET', backendUrl), next).subscribe({
      next: (event) => response = event as HttpResponse<unknown>
    });

    expect(attempts).toBe(2);
    expect(authService.getIdToken.calls.allArgs()).toEqual([[false], [true]]);
    expect(response?.body).toBe('Bearer refreshed-token');
  });

  it('shares one forced refresh across simultaneous 401 responses', () => {
    const refresh = new Subject<string>();
    let attempts = 0;
    authService.getIdToken.and.callFake((forceRefresh = false) =>
      forceRefresh ? refresh : of('firebase-token')
    );
    const next = {
      handle: (): Observable<HttpResponse<unknown>> => {
        attempts += 1;
        return attempts <= 2
          ? throwError(() => new HttpErrorResponse({ status: 401 }))
          : of(new HttpResponse({ status: 200 }));
      }
    } as HttpHandler;

    interceptor.intercept(new HttpRequest('GET', backendUrl), next).subscribe();
    interceptor.intercept(new HttpRequest('GET', backendUrl), next).subscribe();
    expect(authService.getIdToken.calls.allArgs().filter(([force]) => force === true).length).toBe(1);

    refresh.next('refreshed-token');
    refresh.complete();
    expect(attempts).toBe(4);
  });

  it('signs out when token refresh fails', () => {
    authService.getIdToken.and.callFake((forceRefresh = false) =>
      forceRefresh ? throwError(() => new Error('refresh failed')) : of('firebase-token')
    );
    const next = {
      handle: () => throwError(() => new HttpErrorResponse({ status: 401 }))
    } as HttpHandler;

    interceptor.intercept(new HttpRequest('GET', backendUrl), next).subscribe({ error: () => undefined });

    expect(authService.endSession).toHaveBeenCalledOnceWith(
      'Your administrator session has expired. Please sign in again.'
    );
  });

  it('does not retry a 403 and reports an unapproved administrator', () => {
    const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
    next.handle.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    interceptor.intercept(new HttpRequest('GET', backendUrl), next).subscribe({ error: () => undefined });

    expect(next.handle).toHaveBeenCalledTimes(1);
    expect(authService.endSession).toHaveBeenCalledOnceWith(
      'This Firebase account is not approved for administrator access.'
    );
  });
});
