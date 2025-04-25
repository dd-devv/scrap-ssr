import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { TokenStorageService } from '../../auth/services/tokenStorage.service';
import { environment } from '../../../../environments/environment';
import { Subscription, SubscriptionRequest, SubscriptionResponse } from '../interfaces';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private apiUrl = environment.apiUrl;
  public authToken: string | null;

  readonly isLoading = signal<boolean>(false);
  readonly subscriptionsUser = signal<Subscription>({} as Subscription);
  readonly statusSubscription = signal<Boolean>(false);

  constructor() {
    this.authToken = this.tokenStorage.getToken();
  }

  registerSubcription(monto: number, tipo: string): Observable<SubscriptionResponse> {
    const registerData: SubscriptionRequest = {
      monto,
      tipo
    };

    return this.http.post<SubscriptionResponse>(`${this.apiUrl}subscription/insert`, registerData, {
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

    getSubscriptionStatus(): Observable<any> {

      this.isLoading.set(true);

      return this.http.get<any>(`${this.apiUrl}subscription/status`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      })
        .pipe(
          tap(response => {
            this.statusSubscription.set(response.hasActive);
          }),
          catchError(error => {
            return throwError(() => ({
              error: error.error
            }))
          }),
          tap(() => this.isLoading.set(false))
        );
    }
}
