import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { UserCredential } from 'firebase/auth';
import { Observable, of, Subject, throwError } from 'rxjs';
import { AuthNotificationService } from '../../service/auth-notification.service';
import { AuthService } from '../../service/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let notifications: AuthNotificationService;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    notifications = TestBed.inject(AuthNotificationService);
    fixture.detectChanges();
  });

  it('uses valid Firebase credentials and navigates to the dashboard', () => {
    authService.login.and.returnValue(of({} as UserCredential));
    component.form.setValue({ email: 'admin@example.com', password: 'secret' });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'secret'
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('shows a safe invalid-credentials message', () => {
    authService.login.and.returnValue(throwError(() =>
      new FirebaseError('auth/invalid-credential', 'Firebase detail')
    ));
    component.form.setValue({ email: 'admin@example.com', password: 'wrong' });

    component.onSubmit();

    expect(notifications.message()).toBe('Invalid email or password.');
  });

  it('validates email and a missing password before calling Firebase', () => {
    component.form.setValue({ email: 'not-an-email', password: '' });

    component.onSubmit();

    expect(authService.login).not.toHaveBeenCalled();
    expect(notifications.message()).toBe('Enter a valid email address.');
  });

  it('prevents repeated submissions while login is pending', () => {
    const pendingLogin = new Subject<UserCredential>();
    authService.login.and.returnValue(pendingLogin as Observable<UserCredential>);
    component.form.setValue({ email: 'admin@example.com', password: 'secret' });

    component.onSubmit();
    component.onSubmit();

    expect(component.isLoading).toBeTrue();
    expect(authService.login).toHaveBeenCalledTimes(1);
  });
});
