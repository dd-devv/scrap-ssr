import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { TokenStorageService } from '../../auth/services/tokenStorage.service';
import { environment } from '../../../../environments/environment';
import { AddUrlForMeReq, DeleteURLResp, PriceHistory, Product, ProductPublic, RegisterProductReq, RegisterProductRes } from '../interfaces';
import { catchError, Observable, of, tap, throwError, finalize } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export default class ProductService {

  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private apiUrl = environment.apiUrl;

  readonly isLoading = signal<boolean>(false);
  readonly productsUser = signal<Product[]>([]);
  readonly productsPublic = signal<ProductPublic[]>([]);
  readonly priceHistory = signal<PriceHistory>({} as PriceHistory);

  // Get token dynamically instead of storing in constructor
  private get authToken(): string | null {
    return this.tokenStorage.getToken();
  }

  registerUrl(urls: string[], frequency: string): Observable<RegisterProductRes> {
    const registerData: RegisterProductReq = {
      urls,
      frequency
    };

    return this.http.post<RegisterProductRes>(`${this.apiUrl}scraping/job`, registerData, {
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

  addUrlForMe(sourceJobId: string, urlId: string): Observable<RegisterProductRes> {
    const addData: AddUrlForMeReq = {
      sourceJobId,
      urlId
    };

    return this.http.post<RegisterProductRes>(`${this.apiUrl}scraping/add-job-me`, addData, {
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

  deleteUrl(urlId: string): Observable<DeleteURLResp> {
    return this.http.delete<DeleteURLResp>(`${this.apiUrl}scraping/job/delete-url/${urlId}`, {
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

  getLatestResults(): Observable<Product[]> {
    this.isLoading.set(true);

    // Check if we're in browser environment and if token is available
    if (typeof window === 'undefined' || !this.authToken) {
      // We're in SSR or token isn't available yet
      this.isLoading.set(false);
      return of([]); // Return empty array without making the HTTP request
    }

    return this.http.get<Product[]>(`${this.apiUrl}scraping/latest-results`, {
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })
      .pipe(
        tap(response => {
          const sortedProducts = [...response].sort((a, b) =>
            a.productTitle.localeCompare(b.productTitle)
          );
          this.productsUser.set(sortedProducts);
        }),
        catchError(error => {
          console.error('Error fetching products:', error);
          return of([]);
        }),
        finalize(() => this.isLoading.set(false)) // Always set loading to false when done
      );
  }

  getLatestResultsPublic(): Observable<ProductPublic[]> {
    this.isLoading.set(true);

    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      this.isLoading.set(false);
      return of([]);
    }

    return this.http.get<ProductPublic[]>(`${this.apiUrl}scraping/latest-results-public`, {
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })
      .pipe(
        tap(response => {
          this.productsPublic.set(response);
        }),
        catchError(error => {
          return throwError(() => ({
            error: error.error
          }));
        }),
        finalize(() => this.isLoading.set(false))
      );
  }

  getPriceHistory(id: string): Observable<PriceHistory> {

    this.isLoading.set(true);

    return this.http.get<PriceHistory>(`${this.apiUrl}scraping/price-history/${id}`, {
      headers: {
        Authorization: `Bearer ${this.authToken}`
      }
    })
      .pipe(
        tap(response => {
          this.priceHistory.set(response);
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
