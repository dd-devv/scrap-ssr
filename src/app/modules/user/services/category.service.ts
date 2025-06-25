import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { TokenStorageService } from '../../auth/services/tokenStorage.service';
import { environment } from '../../../../environments/environment';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { HasCategorys, UserCategorys } from '../interfaces/category.interfaces';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private apiUrl = environment.apiUrl;
  public authToken: string | null;

  readonly isLoading = signal<boolean>(false);
  hasUserCats = signal<boolean>(true);
  readonly categorysAll = signal<string[]>([]);
  readonly categorysUser = signal<string[]>([]);

  constructor() {
    this.authToken = this.tokenStorage.getToken();
  }

  getCategorysAll(): Observable<string[]> {

    this.isLoading.set(true);

    return this.http.get<string[]>(`${this.apiUrl}category`)
      .pipe(
        tap(response => {
          this.categorysAll.set(response);
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

  getUserCategorys(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}category/user`, {
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })
      .pipe(
        tap(response => {
          this.categorysUser.set(response);
        }),
        catchError(error => {
          return throwError(() => ({
            error: error.error
          }));
        })
      );
  }

  registerUserCategorys(categorys: string[]): Observable<UserCategorys> {

    return this.http.post<UserCategorys>(`${this.apiUrl}category`, { categorys }, {
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

hasUserCategorys(token?: string): Observable<HasCategorys> {
  const authToken = token || this.authToken;

  return this.http.get<HasCategorys>(`${this.apiUrl}category/user-categorys`, {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  })
  .pipe(
    tap(response => {
      this.hasUserCats.set(response.hasCategorys);
    }),
    catchError(error => {
      return throwError(() => ({
        error: error.error
      }));
    })
  );
}
}
