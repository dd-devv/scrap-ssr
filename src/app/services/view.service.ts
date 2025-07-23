import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TokenStorageService } from '../modules/auth/services/tokenStorage.service';
import { environment } from '../../environments/environment';
import { ViewResp, ViewsReq } from '../interfaces';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ViewService {

  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private apiUrl = environment.apiUrl;
  public authToken: string | null;

  constructor() {
    this.authToken = this.tokenStorage.getToken();
  }

  insertView(resultId: string, label: string): Observable<ViewResp> {

    return this.http.post<ViewResp>(`${this.apiUrl}views`, { resultId, label }, {
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
