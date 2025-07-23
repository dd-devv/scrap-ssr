import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TokenStorageService } from '../modules/auth/services/tokenStorage.service';
import { environment } from '../../environments/environment';
import { BuyResp } from '../interfaces';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BuyService {

  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private apiUrl = environment.apiUrl;
  public authToken: string | null;

  constructor() {
    this.authToken = this.tokenStorage.getToken();
  }

  insertBuy(resultId: string, url: string): Observable<BuyResp> {

    return this.http.post<BuyResp>(`${this.apiUrl}buys`, { resultId, url }, {
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
