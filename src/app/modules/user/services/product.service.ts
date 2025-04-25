import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { TokenStorageService } from '../../auth/services/tokenStorage.service';
import { environment } from '../../../../environments/environment';
import { DeleteURLResp, PriceHistory, Product, ProductPublic, RegisterProductReq, RegisterProductRes } from '../interfaces';
import { catchError, Observable, of, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export default class ProductService {

  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private apiUrl = environment.apiUrl;
  public authToken: string | null;

  readonly isLoading = signal<boolean>(false);
  readonly productsUser = signal<Product[]>([]);
  readonly productsPublic = signal<ProductPublic[]>([]);
  readonly priceHistory = signal<PriceHistory>({} as PriceHistory);

  constructor() {
    this.authToken = this.tokenStorage.getToken();
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
          this.isLoading.set(false);
          return of([]);
        })
      );
  }

  getLatestResultsPublic(): Observable<ProductPublic[]> {

    this.isLoading.set(true);

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
          })),
            of([]);
        }),
        tap(() => this.isLoading.set(false))
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
