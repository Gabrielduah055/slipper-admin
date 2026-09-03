import { Injectable } from '@angular/core';
import {
  HttpContextToken,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import {
  catchError,
  finalize,
  Observable,
  shareReplay,
  switchMap,
  throwError
} from 'rxjs';
import { environment } from '../environment/environment';
import { AuthService } from '../service/auth.service';

const AUTH_RETRY = new HttpContextToken<boolean>(() => false);
const SESSION_EXPIRED_MESSAGE = 'Your administrator session has expired. Please sign in again.';
const UNAPPROVED_ADMIN_MESSAGE = 'This Firebase account is not approved for administrator access.';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private refreshToken$: Observable<string> | null = null;
  private readonly apiBaseUrl = environment.baseUrl.replace(/\/+$/, '');

  constructor(private readonly authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isBackendRequest(request.url)) {
      return next.handle(request);
    }

    return this.authService.getIdToken(false).pipe(
      switchMap((token) => next.handle(this.withToken(request, token))),
      catchError((error: unknown): Observable<HttpEvent<unknown>> => {
        if (!(error instanceof HttpErrorResponse)) {
          return this.endSessionAndRethrow<HttpEvent<unknown>>(error, SESSION_EXPIRED_MESSAGE);
        }

        if (error.status === 403) {
          return this.endSessionAndRethrow<HttpEvent<unknown>>(error, UNAPPROVED_ADMIN_MESSAGE);
        }

        if (error.status === 401) {
          return this.handleUnauthorized(request, next, error);
        }

        return throwError(() => error);
      })
    );
  }

  private handleUnauthorized(
    request: HttpRequest<unknown>,
    next: HttpHandler,
    originalError: HttpErrorResponse
  ): Observable<HttpEvent<unknown>> {
    if (request.context.get(AUTH_RETRY) || !this.authService.currentUser) {
      return this.endSessionAndRethrow(originalError, SESSION_EXPIRED_MESSAGE);
    }

    return this.refreshToken().pipe(
      catchError((error: unknown) =>
        this.endSessionAndRethrow<string>(error, SESSION_EXPIRED_MESSAGE)
      ),
      switchMap((token) => {
        const retry = this.withToken(
          request.clone({ context: request.context.set(AUTH_RETRY, true) }),
          token
        );

        return next.handle(retry).pipe(
          catchError((retryError: unknown) => {
            if (retryError instanceof HttpErrorResponse && retryError.status === 403) {
              return this.endSessionAndRethrow<HttpEvent<unknown>>(retryError, UNAPPROVED_ADMIN_MESSAGE);
            }

            if (retryError instanceof HttpErrorResponse && retryError.status === 401) {
              return this.endSessionAndRethrow<HttpEvent<unknown>>(retryError, SESSION_EXPIRED_MESSAGE);
            }

            return throwError(() => retryError);
          })
        );
      })
    );
  }

  private refreshToken(): Observable<string> {
    if (!this.refreshToken$) {
      this.refreshToken$ = this.authService.getIdToken(true).pipe(
        finalize(() => {
          this.refreshToken$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.refreshToken$;
  }

  private withToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  private isBackendRequest(url: string): boolean {
    return url === this.apiBaseUrl
      || url.startsWith(`${this.apiBaseUrl}/`)
      || url.startsWith(`${this.apiBaseUrl}?`);
  }

  private endSessionAndRethrow<T>(error: unknown, message: string): Observable<T> {
    return this.authService.endSession(message).pipe(
      switchMap(() => throwError(() => error))
    );
  }
}
