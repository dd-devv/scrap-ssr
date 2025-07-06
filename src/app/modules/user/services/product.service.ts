import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { TokenStorageService } from '../../auth/services/tokenStorage.service';
import { environment } from '../../../../environments/environment';
import { AddUrlForMeReq, DeleteURLResp, MyJobResp, PriceHistory, Product, ProductPublic, RegisterProductReq, RegisterProductRes } from '../interfaces';
import { catchError, Observable, of, tap, throwError, finalize, from, lastValueFrom } from 'rxjs';
import { injectQuery, QueryClient } from '@tanstack/angular-query-experimental';

@Injectable({
  providedIn: 'root'
})
export default class ProductService {

  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private queryClient = inject(QueryClient);
  private apiUrl = environment.apiUrl;

  // Crear un computed signal para el token
  private authToken = computed(() => this.tokenStorage.getToken());

  readonly isLoading = signal<boolean>(false);
  readonly isLoadingEqual = signal<boolean>(false);
  readonly isLoadingRec = signal<boolean>(false);
  readonly productsUser = signal<Product[]>([]);
  readonly productsPublic = signal<ProductPublic[]>([]);
  readonly productsAll = signal<ProductPublic[]>([]);
  readonly productsEqual = signal<ProductPublic[]>([]);
  readonly productsRecommended = signal<ProductPublic[]>([]);
  readonly priceHistory = signal<PriceHistory>({} as PriceHistory);

  // TanStack Query definitions
  private latestResultsQuery = injectQuery(() => ({
    queryKey: ['latest-results', this.authToken()],
    queryFn: () => this.fetchLatestResults(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!this.authToken() && typeof window !== 'undefined'
  }));

  private latestResultsPublicQuery = injectQuery(() => ({
    queryKey: ['latest-results-public'],
    queryFn: () => this.fetchLatestResultsPublic(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    enabled: typeof window !== 'undefined'
  }));

  private productsAllQuery = injectQuery(() => ({
    queryKey: ['products-all'],
    queryFn: () => this.fetchProductsPublic(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    enabled: typeof window !== 'undefined'
  }));

  registerUrl(urls: string[], frequency: string): Observable<RegisterProductRes> {
    const registerData: RegisterProductReq = {
      urls,
      frequency
    };

    return this.http.post<RegisterProductRes>(`${this.apiUrl}scraping/job`, registerData, {
      headers: {
        Authorization: `Bearer ${this.authToken()}`
      }
    })
      .pipe(
        tap(response => {
          // Invalidar queries relacionadas cuando se registra una nueva URL
          this.queryClient.invalidateQueries({ queryKey: ['latest-results'] });
          return response;
        }),
        catchError(error => {
          return throwError(() => ({
            error: error.error
          }));
        })
      );
  }

  getMyJob(urlId: string): Observable<MyJobResp> {
    return this.http.get<MyJobResp>(`${this.apiUrl}scraping/my-job/${urlId}`, {
      headers: {
        Authorization: `Bearer ${this.authToken()}`
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
        Authorization: `Bearer ${this.authToken()}`
      }
    })
      .pipe(
        tap(response => {
          // Invalidar queries relacionadas
          this.queryClient.invalidateQueries({ queryKey: ['latest-results'] });
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
        Authorization: `Bearer ${this.authToken()}`
      }
    })
      .pipe(
        tap(response => {
          // Invalidar queries relacionadas
          this.queryClient.invalidateQueries({ queryKey: ['latest-results'] });
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
    if (typeof window === 'undefined' || !this.authToken()) {
      this.isLoading.set(false);
      return of([]);
    }

    // Si hay datos en cache y no están stale, usarlos
    if (this.latestResultsQuery.data() && !this.latestResultsQuery.isStale()) {
      const cachedData = this.latestResultsQuery.data()!;
      this.productsUser.set(cachedData);
      this.isLoading.set(false);
      return of(cachedData);
    }

    // Si no hay datos en cache o están stale, hacer fetch
    return from(
      this.queryClient.fetchQuery({
        queryKey: ['latest-results', this.authToken()],
        queryFn: () => this.fetchLatestResults(),
        staleTime: 2 * 60 * 1000,
      })
    ).pipe(
      tap(response => {
        const sortedProducts = [...response].sort((a, b) =>
          b.firstDate.toString().localeCompare(a.firstDate.toString())
        );
        this.productsUser.set(sortedProducts);
      }),
      catchError(error => {
        console.error('Error fetching products:', error);
        return of([]);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  getLatestResultsPublic(): Observable<ProductPublic[]> {
    this.isLoading.set(true);

    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      this.isLoading.set(false);
      return of([]);
    }

    // Si hay datos en cache y no están stale, usarlos
    if (this.latestResultsPublicQuery.data() && !this.latestResultsPublicQuery.isStale()) {
      const cachedData = this.latestResultsPublicQuery.data()!;
      this.productsPublic.set(cachedData);
      this.isLoading.set(false);
      return of(cachedData);
    }

    // Si no hay datos en cache o están stale, hacer fetch
    return from(
      this.queryClient.fetchQuery({
        queryKey: ['latest-results-public'],
        queryFn: () => this.fetchLatestResultsPublic(),
        staleTime: 2 * 60 * 1000,
      })
    ).pipe(
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

  getProductsPublic(): Observable<ProductPublic[]> {
    this.isLoading.set(true);

    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      this.isLoading.set(false);
      return of([]);
    }

    // Si hay datos en cache y no están stale, usarlos
    if (this.productsAllQuery.data() && !this.productsAllQuery.isStale()) {
      const cachedData = this.productsAllQuery.data()!;
      this.productsAll.set(cachedData);
      this.isLoading.set(false);
      return of(cachedData);
    }

    // Si no hay datos en cache o están stale, hacer fetch
    return from(
      this.queryClient.fetchQuery({
        queryKey: ['products-all'],
        queryFn: () => this.fetchProductsPublic(),
        staleTime: 5 * 60 * 1000,
      })
    ).pipe(
      tap(response => {
        const sortedProducts = [...response].sort((a, b) =>
          a.firstDate.toString().localeCompare(b.firstDate.toString())
        );
        this.productsAll.set(sortedProducts);
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

    // Usar cache para price history también
    const queryKey = ['price-history', id, this.authToken()];

    return from(
      this.queryClient.fetchQuery({
        queryKey,
        queryFn: () => this.fetchPriceHistory(id),
        staleTime: 10 * 60 * 1000, // 10 minutos - los precios no cambian tan rápido
      })
    ).pipe(
      tap(response => {
        this.priceHistory.set(response);
      }),
      catchError(error => {
        return throwError(() => ({
          error: error.error
        }));
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  getProductsEqual(id: string): Observable<ProductPublic[]> {
    this.isLoadingEqual.set(true);

    // Usar cache para productos iguales
    const queryKey = ['products-equal', id, this.authToken()];

    return from(
      this.queryClient.fetchQuery({
        queryKey,
        queryFn: () => this.fetchProductsEqual(id),
        staleTime: 5 * 60 * 1000, // 5 minutos
      })
    ).pipe(
      tap(response => {
        this.productsEqual.set(response);
      }),
      catchError(error => {
        return throwError(() => ({
          error: error.error
        }));
      }),
      finalize(() => this.isLoadingEqual.set(false))
    );
  }

  getProductsRecommended(id: string): Observable<ProductPublic[]> {
    this.isLoadingRec.set(true);

    // Usar cache para productos recomendados
    const queryKey = ['products-recommended', id, this.authToken()];

    return from(
      this.queryClient.fetchQuery({
        queryKey,
        queryFn: () => this.fetchProductsRecommended(id),
        staleTime: 5 * 60 * 1000, // 5 minutos
      })
    ).pipe(
      tap(response => {
        this.productsRecommended.set(response);
      }),
      catchError(error => {
        return throwError(() => ({
          error: error.error
        }));
      }),
      finalize(() => this.isLoadingRec.set(false))
    );
  }

  // Métodos privados para hacer los fetch reales (query functions)
  private fetchLatestResults(): Promise<Product[]> {
    return lastValueFrom(
      this.http.get<Product[]>(`${this.apiUrl}scraping/latest-results`, {
        headers: {
          Authorization: `Bearer ${this.authToken()}`
        }
      })
    );
  }

  private fetchLatestResultsPublic(): Promise<ProductPublic[]> {
    return lastValueFrom(
      this.http.get<ProductPublic[]>(`${this.apiUrl}scraping/latest-results-public`, {
        headers: {
          Authorization: `Bearer ${this.authToken()}`
        }
      })
    );
  }

  private fetchProductsPublic(): Promise<ProductPublic[]> {
    return lastValueFrom(
      this.http.get<ProductPublic[]>(`${this.apiUrl}scraping/products-public`)
    );
  }

  private fetchPriceHistory(id: string): Promise<PriceHistory> {
    return lastValueFrom(
      this.http.get<PriceHistory>(`${this.apiUrl}scraping/price-history/${id}`, {
        headers: {
          Authorization: `Bearer ${this.authToken()}`
        }
      })
    );
  }

  private fetchProductsEqual(id: string): Promise<ProductPublic[]> {
    return lastValueFrom(
      this.http.get<ProductPublic[]>(`${this.apiUrl}scraping/equal-results/${id}`, {
        headers: {
          Authorization: `Bearer ${this.authToken()}`
        }
      })
    );
  }

  private fetchProductsRecommended(id: string): Promise<ProductPublic[]> {
    return lastValueFrom(
      this.http.get<ProductPublic[]>(`${this.apiUrl}scraping/recommended-results/${id}`, {
        headers: {
          Authorization: `Bearer ${this.authToken()}`
        }
      })
    );
  }

  // Métodos para invalidar cache manualmente
  invalidateLatestResults() {
    this.queryClient.invalidateQueries({ queryKey: ['latest-results'] });
  }

  invalidateProductsAll() {
    this.queryClient.invalidateQueries({ queryKey: ['products-all'] });
  }

  invalidatePriceHistory(id?: string) {
    if (id) {
      this.queryClient.invalidateQueries({ queryKey: ['price-history', id] });
    } else {
      this.queryClient.invalidateQueries({ queryKey: ['price-history'] });
    }
  }

  invalidateProductsEqual(id?: string) {
    if (id) {
      this.queryClient.invalidateQueries({ queryKey: ['products-equal', id] });
    } else {
      this.queryClient.invalidateQueries({ queryKey: ['products-equal'] });
    }
  }

  invalidateProductsRecommended(id?: string) {
    if (id) {
      this.queryClient.invalidateQueries({ queryKey: ['products-recommended', id] });
    } else {
      this.queryClient.invalidateQueries({ queryKey: ['products-recommended'] });
    }
  }

  // Método para refrescar todos los datos
  refreshAllData() {
    this.queryClient.invalidateQueries();
  }
}
