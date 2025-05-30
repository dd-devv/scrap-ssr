import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { TokenStorageService } from '../modules/auth/services/tokenStorage.service';
import { environment } from '../../environments/environment';
import { FeedbackReq, FeedResp } from '../modules/user/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {

  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private apiUrl = environment.apiUrl;
  public authToken: string | null;

  readonly isLoading = signal<boolean>(false);
  readonly notificationsUser = signal<Notification[]>([]);

  constructor() {
    this.authToken = this.tokenStorage.getToken();
  }

  saveFeedback(data: FeedbackReq): Observable<FeedResp> {
    return this.http.post<FeedResp>(`${this.apiUrl}feedback`, { data }, {
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
