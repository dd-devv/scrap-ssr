import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { SearchReq, SearchRes } from '../modules/user/interfaces';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { TokenStorageService } from '../modules/auth/services/tokenStorage.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  readonly isLoading = signal<boolean>(true);
  readonly results = signal<SearchRes[]>([]);
  private tokenStorage = inject(TokenStorageService);

  private authToken = computed(() => this.tokenStorage.getToken());

  searTerm(term: string): Observable<SearchRes[]> {

    this.isLoading.set(true);
    const searchData: SearchReq = {
      term
    };

    return this.http.post<SearchRes[]>(`${this.apiUrl}search`, searchData, {
      headers: {
        Authorization: `Bearer ${this.authToken()}`
      }
    })
      .pipe(
        tap(response => {
          this.results.set(response);
          this.isLoading.set(false);
          return response;
        }),
        catchError(error => {
          this.isLoading.set(false);
          return throwError(() => ({
            error: error.error
          }));
        })
      );
  }
}
