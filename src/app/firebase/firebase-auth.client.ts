import { inject, Injectable, InjectionToken } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  browserSessionPersistence,
  getIdToken,
  initializeAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  Unsubscribe,
  User,
  UserCredential
} from 'firebase/auth';
import { environment } from '../environment/environment';

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP', {
  providedIn: 'root',
  factory: () => getApps().length > 0 ? getApp() : initializeApp(environment.firebase)
});

export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH', {
  providedIn: 'root',
  // Session persistence keeps an administrator signed in while this browser
  // window is open, but requires credentials again after the window closes.
  factory: () => initializeAuth(inject(FIREBASE_APP), {
    persistence: browserSessionPersistence
  })
});

@Injectable({ providedIn: 'root' })
export class FirebaseAuthClient {
  private readonly auth = inject(FIREBASE_AUTH);

  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  observeAuthState(
    next: (user: User | null) => void,
    error: (error: Error) => void
  ): Unsubscribe {
    return onAuthStateChanged(this.auth, next, error);
  }

  signIn(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  signOut(): Promise<void> {
    return signOut(this.auth);
  }

  getIdToken(forceRefresh = false): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) {
      return Promise.reject(new Error('No authenticated Firebase user.'));
    }

    return getIdToken(user, forceRefresh);
  }
}
