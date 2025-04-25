import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly AUTH_TOKEN_KEY = 'auth_token';
  private readonly VERIFICATION_TOKEN_KEY = 'verification_token';
  private platformId = inject(PLATFORM_ID);

  // Tokens en memoria
  private inMemoryAuthToken: string | null = null;
  private inMemoryVerificationToken: string | null = null;

  // Token de sesión
  setToken(token: string): void {
    this.inMemoryAuthToken = token;

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.AUTH_TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      // En el navegador, intentamos recuperar de localStorage primero
      const storedToken = localStorage.getItem(this.AUTH_TOKEN_KEY);
      // Si existe en localStorage, actualizamos la versión en memoria
      if (storedToken) {
        this.inMemoryAuthToken = storedToken;
      }
    }

    return this.inMemoryAuthToken;
  }

  removeToken(): void {
    this.inMemoryAuthToken = null;

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.AUTH_TOKEN_KEY);
    }
  }

  // Token de verificación
  setVerificationToken(token: string): void {
    this.inMemoryVerificationToken = token;

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.VERIFICATION_TOKEN_KEY, token);
    }
  }

  getVerificationToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      // En el navegador, intentamos recuperar de localStorage primero
      const storedToken = localStorage.getItem(this.VERIFICATION_TOKEN_KEY);
      // Si existe en localStorage, actualizamos la versión en memoria
      if (storedToken) {
        this.inMemoryVerificationToken = storedToken;
      }
    }

    return this.inMemoryVerificationToken;
  }

  removeVerificationToken(): void {
    this.inMemoryVerificationToken = null;

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.VERIFICATION_TOKEN_KEY);
    }
  }

  // Eliminar todos los tokens
  clearAllTokens(): void {
    this.removeToken();
    this.removeVerificationToken();
  }
}
