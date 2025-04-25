import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PublicService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    readonly usersLenght = signal<number>(0);
    readonly totalUrls = signal<number>(0);

  constructor() { }

    getUsersLenght(): Observable<number> {

      return this.http.get<any>(`${this.apiUrl}users/cantidades`)
        .pipe(
          tap(response => {
            this.usersLenght.set(response.totalUsers);
            this.totalUrls.set(response.totalUrlsScraped);
          }),
          catchError(error => {
            return throwError(() => ({
              error: error.error
            }))
          })
        );
    }

}
