import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, UpdateRequest, User, VerifyCodeResponse } from '../interfaces';
import { environment } from '../../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { TokenStorageService } from './tokenStorage.service';
import { jwtDecode } from 'jwt-decode';
import { UpdatePasswordRequest, UpdateResponse } from '../interfaces/register.interface';
import { Router } from '@angular/router';

interface TokenPayload {
  userId: string;
  purpose?: string;
  iat: number;
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export default class AuthService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = environment.apiUrl;

  // Signals para estado de autenticación
  isAuthenticated = signal<boolean>(false);
  needsVerification = signal<boolean>(false);
  currentUser = signal<User | null>(null);
  public authToken: any;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Verificar el estado de autenticación en el navegador
      this.checkAuthStatus().subscribe();

      this.authToken = this.tokenStorage.getToken();
    }
  }

  login(whatsapp: string, code: string): Observable<LoginResponse> {
    const loginData: LoginRequest = {
      whatsapp,
      code
    };

    return this.http.post<LoginResponse>(`${this.apiUrl}users/login`, loginData)
      .pipe(
        tap(response => {
          this.tokenStorage.setToken(response.token);
          this.currentUser.set(response.user);
          this.isAuthenticated.set(true);
          this.needsVerification.set(false);
          // Al iniciar sesión, eliminamos cualquier token de verificación que pudiera existir
          this.tokenStorage.removeVerificationToken();
        }),
        catchError(error => {
          this.tokenStorage.setVerificationToken(error.error.tempToken);
          this.needsVerification.set(true);

          return throwError(() => ({
            error: error.error
          }));
        })
      );
  }

  forgotPassword(whatsapp: string): Observable<string> {

    return this.http.post<string>(`${this.apiUrl}users/forgot-password`, { whatsapp })
      .pipe(
        tap(),
        catchError(error => {
          return throwError(() => ({
            error: error.error
          }));
        })
      );
  }

  resetPassword(resetToken: string, newPassword: string): Observable<string> {

    return this.http.post<string>(`${this.apiUrl}users/reset-password`, { resetToken, newPassword })
      .pipe(
        tap(),
        catchError(error => {
          return throwError(() => ({
            error: error.error
          }));
        })
      );
  }

  register(fullname: string, whatsapp: string): Observable<RegisterResponse> {
    const registerData: RegisterRequest = {
      fullname,
      // email,
      whatsapp
    };

    return this.http.post<RegisterResponse>(`${this.apiUrl}users/register`, registerData)
      .pipe(
        tap(response => {
          // Almacenar el token temporal como token de verificación
          this.tokenStorage.setVerificationToken(response.tempToken);
          this.needsVerification.set(true);
        }),
        catchError(error => {
          return throwError(() => ({
            error: error.error
          }));
        })
      );
  }

  updateProfile(fullname: string, email: string, whatsapp: string): Observable<UpdateResponse> {
    const updateData: UpdateRequest = {
      fullname,
      email,
      whatsapp
    };

    return this.http.put<UpdateResponse>(`${this.apiUrl}users/profile`, updateData, {
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })
      .pipe(
        tap(response => {
          // Almacenar el token temporal como token de verificación
          this.currentUser.set(response.user);
        }),
        catchError(error => {
          return throwError(() => ({
            error: error.error
          }));
        })
      );
  }

  updatePassword(currentPassword: string, newPassword: string): Observable<string> {
    const passwordData: UpdatePasswordRequest = {
      currentPassword,
      newPassword
    };

    return this.http.put<string>(`${this.apiUrl}users/update-password`, passwordData, {
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })
      .pipe(
        tap(),
        catchError(error => {
          return throwError(() => ({
            error: error.error
          }));
        })
      );
  }

  //Funcion para enviar codig de whatsapp apra actualizacion
  requestWhatsappVerificationCode(whatsapp: string): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}users/send-code-whatsapp`, { whatsapp }, {
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })
      .pipe(
        tap(response => {
          return response;
        }),
        catchError(error => {
          return throwError(() => ({
            error: error.error
          }));
        })
      );
  }

  //Funcion para enviar codig de whatsapp para login
  requestLoginCode(whatsapp: string): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}users/send-code-login`, { whatsapp })
      .pipe(
        tap(response => {
          return response;
        }),
        catchError(error => {
          return throwError(() => ({
            error: error.error
          }));
        })
      );
  }

  verificar_whatsapp(telefono: string): Observable<any> {
    return this.http.post(this.apiUrl + 'users/verificar-whatsapp', { numero: telefono });
  }

  verificar_codigo(code: string): Observable<VerifyCodeResponse> {
    const tempToken = this.tokenStorage.getVerificationToken();
    return this.http.post<VerifyCodeResponse>(this.apiUrl + 'users/verify-code', { tempToken, code })
      .pipe(
        tap(response => {
          if (response.accessToken && response.user) {
            // Verificación exitosa - guardar token de sesión
            this.tokenStorage.setToken(response.accessToken);
            this.currentUser.set(response.user);
            this.isAuthenticated.set(true);
            this.needsVerification.set(false);

            this.tokenStorage.removeVerificationToken();
          } else if (response.tempToken) {
            this.tokenStorage.setVerificationToken(response.tempToken);
            this.needsVerification.set(true);
            this.isAuthenticated.set(false);
          }
        }),
        catchError(error => {
          if (error.error.tempToken) {
            this.tokenStorage.setVerificationToken(error.error.tempToken);
            this.needsVerification.set(true);
            this.isAuthenticated.set(false);
          }

          return throwError(() => ({
            error: error.error || 'Error en la verificación'
          }));
        })
      );
  }

  verifyCodeUpdate(code: string): Observable<VerifyCodeResponse> {
    const tempToken = this.authToken;
    return this.http.post<VerifyCodeResponse>(this.apiUrl + 'users/verify-code', { tempToken, code })
      .pipe(
        tap(),
        catchError(error => {
          return throwError(() => ({
            error: error.error || 'Error en la verificación'
          }));
        })
      );
  }

  logout(): void {
    this.tokenStorage.clearAllTokens();
    this.isAuthenticated.set(false);
    this.needsVerification.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/']);
    /*TODO: Para SSR quitar esto*/
    window.location.reload();
  }

  // Verifica el tipo de token y establece el estado apropiado
  checkAuthStatus(): Observable<boolean> {
    // Si estamos en el servidor, no tenemos estado de autenticación
    if (!isPlatformBrowser(this.platformId)) {
      return of(false);
    }

    const authToken = this.tokenStorage.getToken();
    const verificationToken = this.tokenStorage.getVerificationToken();

    // Primero verificar si hay un token de verificación pendiente
    if (verificationToken) {
      try {
        const decoded = jwtDecode<TokenPayload>(verificationToken);

        // Verificar si el token es de verificación y está vigente
        if (decoded.purpose === 'verification' && decoded.exp * 1000 > Date.now()) {
          this.needsVerification.set(true);
          this.isAuthenticated.set(false);
          return of(false);
        } else {
          // Token de verificación expirado, lo eliminamos
          this.tokenStorage.removeVerificationToken();
        }
      } catch (error) {
        this.tokenStorage.removeVerificationToken();
      }
    }

    // Si no hay token de autenticación, no estamos autenticados
    if (!authToken) {
      this.isAuthenticated.set(false);
      this.needsVerification.set(false);
      return of(false);
    }

    // Verificar el token con el backend
    return this.http.get<User>(`${this.apiUrl}users/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }).pipe(
      map(user => {
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
        this.needsVerification.set(false);
        return true;
      }),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  // Métodos para verificar el estado actual
  isAuthenticatedUser(): boolean {
    return this.isAuthenticated();
  }

  hasVerificationPending(): boolean {
    return this.needsVerification();
  }

  // Método para decodificar y verificar el token actual
  getDecodedToken(token: string | null): TokenPayload | null {
    if (!token) return null;

    try {
      return jwtDecode<TokenPayload>(token);
    } catch (error) {
      return null;
    }
  }

  // Obtener tipo de token actual
  getTokenType(): 'verification' | 'session' | null {
    const verificationToken = this.tokenStorage.getVerificationToken();
    const authToken = this.tokenStorage.getToken();

    if (verificationToken) {
      const decoded = this.getDecodedToken(verificationToken);
      if (decoded && decoded.purpose === 'verification') {
        return 'verification';
      }
    }

    if (authToken) {
      const decoded = this.getDecodedToken(authToken);
      if (decoded) {
        return 'session';
      }
    }

    return null;
  }

  // Obtener tokens
  getAuthToken(): string | null {
    return this.tokenStorage.getToken();
  }

  getVerificationToken(): string | null {
    return this.tokenStorage.getVerificationToken();
  }
}
