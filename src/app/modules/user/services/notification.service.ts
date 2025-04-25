import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { TokenStorageService } from '../../auth/services/tokenStorage.service';
import { environment } from '../../../../environments/environment';
import { Notification } from '../interfaces';
import { catchError, Observable, of, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private apiUrl = environment.apiUrl;
  public authToken: string | null;

  readonly isLoading = signal<boolean>(false);
  readonly notificationsUser = signal<Notification[]>([]);

  constructor() {
    this.authToken = this.tokenStorage.getToken();
  }

  getNotifications(): Observable<Notification[]> {

    this.isLoading.set(true);

    return this.http.get<Notification[]>(`${this.apiUrl}notification/get`, {
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })
      .pipe(
        tap(response => {
          this.notificationsUser.set(response);
        }),
        catchError(error => {
          return throwError(() => ({
            error: error.error
          })),
            of([]);
        }),
        tap(() => this.isLoading.set(false))
      );
  }

  readNotification(id: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}notification/read/${id}`, {data: true}, {
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

}
