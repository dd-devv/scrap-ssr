import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { TokenStorageService } from '../../auth/services/tokenStorage.service';
import { environment } from '../../../../environments/environment';
import { AddUrlForMeReq, DeleteURLResp, MyJobResp, PriceHistory, ProdsResp, Product, ProductPublic, RegisterProductReq, RegisterProductRes } from '../interfaces';
import { catchError, Observable, of, tap, throwError, finalize } from 'rxjs';
import { injectQueryClient, injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export default class ProductService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private queryClient = injectQueryClient();
  private apiUrl = environment.apiUrl;

  // Signals para compatibilidad con componentes existentes
  readonly isLoading = signal<boolean>(false);
  readonly isLoadingEqual = signal<boolean>(false);
  readonly isLoadingRec = signal<boolean>(false);
  readonly productsUser = signal<Product[]>([]);
  readonly productsPublic = signal<ProductPublic[]>([]);
  readonly productsAll = signal<ProductPublic[]>([]);
  readonly productsEqual = signal<ProductPublic[]>([]);
  readonly productsRecommended = signal<ProductPublic[]>([]);
  readonly priceHistory = signal<PriceHistory>({} as PriceHistory);

  private get authToken(): string | null {
    return this.tokenStorage.getToken();
  }

  private async fetchWithAuth<T>(url: string): Promise<T> {
    return await lastValueFrom(
      this.http.get<T>(url, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      })
    );
  }

  // ============= NUEVAS QUERIES CON injectQuery =============

  // Query para latest results (user)
  latestResultsQuery = injectQuery(() => ({
    queryKey: ['latest-results'],
    queryFn: async () => {
      if (typeof window === 'undefined' || !this.authToken) return [];
      const data = await this.fetchWithAuth<Product[]>(`${this.apiUrl}scraping/latest-results`);
      return data.sort((a, b) => b.firstDate.toString().localeCompare(a.firstDate.toString()));
    },
    staleTime: 1000 * 60 * 5,
    enabled: () => typeof window !== 'undefined' && !!this.authToken
  }));

  // Query para latest results public
  latestResultsPublicQuery = injectQuery(() => ({
    queryKey: ['latest-results-public'],
    queryFn: async () => {
      if (typeof window === 'undefined') return [];
      return await this.fetchWithAuth<ProductPublic[]>(`${this.apiUrl}scraping/latest-results-public`);
    },
    staleTime: 1000 * 60 * 5,
    enabled: () => typeof window !== 'undefined' && !!this.authToken
  }));

  // Query para available stores
  availableStoresQuery = injectQuery(() => ({
    queryKey: ['available-stores'],
    queryFn: () => lastValueFrom(this.http.get<string[]>(`${this.apiUrl}scraping/available-stores`)),
    staleTime: 1000 * 60 * 30 // 30 minutos cache para stores
  }));

  // ============= FUNCIONES PARA QUERIES DINÁMICAS =============

  // Función para crear query de price history
  createPriceHistoryQuery(id: string) {
    return injectQuery(() => ({
      queryKey: ['price-history', id],
      queryFn: () => this.fetchWithAuth<PriceHistory>(`${this.apiUrl}scraping/price-history/${id}`),
      staleTime: 1000 * 60 * 5,
      enabled: () => !!id && !!this.authToken
    }));
  }

  // Función para crear query de products equal
  createProductsEqualQuery(id: string) {
    return injectQuery(() => ({
      queryKey: ['products-equal', id],
      queryFn: () => this.fetchWithAuth<ProductPublic[]>(`${this.apiUrl}scraping/equal-results/${id}`),
      staleTime: 1000 * 60 * 5,
      enabled: () => !!id && !!this.authToken
    }));
  }

  // Función para crear query de products recommended
  createProductsRecommendedQuery(id: string) {
    return injectQuery(() => ({
      queryKey: ['products-rec', id],
      queryFn: () => this.fetchWithAuth<ProductPublic[]>(`${this.apiUrl}scraping/recommended-results/${id}`),
      staleTime: 1000 * 60 * 5,
      enabled: () => !!id && !!this.authToken
    }));
  }

  // Función para crear query de products public paginados
  createProductsPublicQuery(page: number, items: number, filters: any = {}) {
    return injectQuery(() => ({
      queryKey: ['products-public', page, items, filters],
      queryFn: async () => {
        const body = { page, items, ...filters };
        const response = await lastValueFrom(
          this.http.post<ProdsResp>(`${this.apiUrl}scraping/products-public`, body).pipe(
            catchError(error => throwError(() => ({ error: error.error })))
          )
        );

        // Ordenar productos por fecha
        const sorted = [...response.products].sort((a, b) =>
          a.firstDate.toString().localeCompare(b.firstDate.toString())
        );

        return { ...response, products: sorted };
      },
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 5
    }));
  }

  // ============= FUNCIONES LEGACY (MANTENER COMPATIBILIDAD) =============

  private cacheObservable<T>(queryKey: any[], fetchFn: () => Promise<T>, signalRef: any, loadingRef: any): Observable<T> {
    loadingRef.set(true);

    return new Observable<T>(subscriber => {
      // Usar fetchQuery para mantener la query activa
      this.queryClient.fetchQuery({
        queryKey,
        queryFn: fetchFn,
        staleTime: 1000 * 60 * 5
      })
        .then(data => {
          signalRef.set(data);
          loadingRef.set(false);
          subscriber.next(data);
          subscriber.complete();
        })
        .catch(err => {
          loadingRef.set(false);
          subscriber.error(err);
        });
    });
  }

  // Funciones legacy mantenidas para compatibilidad
  getLatestResults(): Observable<Product[]> {
    if (typeof window === 'undefined' || !this.authToken) return of([]);
    return this.cacheObservable(
      ['latest-results'],
      async () => {
        const data = await this.fetchWithAuth<Product[]>(`${this.apiUrl}scraping/latest-results`);
        return data.sort((a, b) => b.firstDate.toString().localeCompare(a.firstDate.toString()));
      },
      this.productsUser,
      this.isLoading
    );
  }

  getLatestResultsPublic(): Observable<ProductPublic[]> {
    if (typeof window === 'undefined') return of([]);
    return this.cacheObservable(
      ['latest-results-public'],
      () => this.fetchWithAuth<ProductPublic[]>(`${this.apiUrl}scraping/latest-results-public`),
      this.productsPublic,
      this.isLoading
    );
  }

  getProductsPublic(page: number, items: number, filters: any = {}): Observable<ProdsResp> {
    this.isLoading.set(true);

    return new Observable<ProdsResp>(subscriber => {
      const queryKey = ['products-public', page, items, filters];

      this.queryClient.fetchQuery({
        queryKey,
        queryFn: async () => {
          const body = { page, items, ...filters };
          const response = await lastValueFrom(
            this.http.post<ProdsResp>(`${this.apiUrl}scraping/products-public`, body).pipe(
              catchError(error => throwError(() => ({ error: error.error })))
            )
          );
          return response;
        },
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5
      })
        .then(data => {
          const sorted = [...data.products].sort((a, b) =>
            a.firstDate.toString().localeCompare(b.firstDate.toString())
          );

          this.productsAll.set(sorted);
          const sortedResponse = { ...data, products: sorted };

          this.isLoading.set(false);
          subscriber.next(sortedResponse);
          subscriber.complete();
        })
        .catch(err => {
          this.isLoading.set(false);
          subscriber.error(err);
        });
    });
  }

  getPriceHistory(id: string): Observable<PriceHistory> {
    return this.cacheObservable(
      ['price-history', id],
      () => this.fetchWithAuth<PriceHistory>(`${this.apiUrl}scraping/price-history/${id}`),
      this.priceHistory,
      this.isLoading
    );
  }

  getProductsEqual(id: string): Observable<ProductPublic[]> {
    return this.cacheObservable(
      ['products-equal', id],
      () => this.fetchWithAuth<ProductPublic[]>(`${this.apiUrl}scraping/equal-results/${id}`),
      this.productsEqual,
      this.isLoadingEqual
    );
  }

  getProductsRecommended(id: string): Observable<ProductPublic[]> {
    return this.cacheObservable(
      ['products-rec', id],
      () => this.fetchWithAuth<ProductPublic[]>(`${this.apiUrl}scraping/recommended-results/${id}`),
      this.productsRecommended,
      this.isLoadingRec
    );
  }

  getAvailableStores(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}scraping/available-stores`);
  }

  // ============= FUNCIONES DE MUTACIÓN =============

  registerUrl(urls: string[], frequency: string): Observable<RegisterProductRes> {
    const registerData: RegisterProductReq = { urls, frequency };
    return this.http.post<RegisterProductRes>(`${this.apiUrl}scraping/job`, registerData, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    }).pipe(
      catchError(error => throwError(() => ({ error: error.error }))),
      tap(() => {
        // Invalidar queries relacionadas después de registrar
        this.invalidateUserQueries();
      })
    );
  }

  getMyJob(urlId: string): Observable<MyJobResp> {
    return this.http.get<MyJobResp>(`${this.apiUrl}scraping/my-job/${urlId}`, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    }).pipe(
      catchError(error => throwError(() => ({ error: error.error })))
    );
  }

  addUrlForMe(sourceJobId: string, urlId: string): Observable<RegisterProductRes> {
    const addData: AddUrlForMeReq = { sourceJobId, urlId };
    return this.http.post<RegisterProductRes>(`${this.apiUrl}scraping/add-job-me`, addData, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    }).pipe(
      catchError(error => throwError(() => ({ error: error.error }))),
      tap(() => {
        // Invalidar queries relacionadas después de agregar
        this.invalidateUserQueries();
      })
    );
  }

  deleteUrl(urlId: string): Observable<DeleteURLResp> {
    return this.http.delete<DeleteURLResp>(`${this.apiUrl}scraping/job/delete-url/${urlId}`, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    }).pipe(
      catchError(error => throwError(() => ({ error: error.error }))),
      tap(() => {
        // Invalidar queries relacionadas después de eliminar
        this.invalidateUserQueries();
      })
    );
  }

  // ============= HELPERS PARA CACHE =============

  // Invalidar queries de usuario
  invalidateUserQueries(): void {
    this.queryClient.invalidateQueries({ queryKey: ['latest-results'] });
    this.queryClient.invalidateQueries({ queryKey: ['latest-results-public'] });
  }

  // Invalidar queries de productos públicos
  invalidateProductsPublic(): void {
    this.queryClient.invalidateQueries({ queryKey: ['products-public'] });
  }

  // Invalidar query específica de price history
  invalidatePriceHistory(id: string): void {
    this.queryClient.invalidateQueries({ queryKey: ['price-history', id] });
  }

  // Invalidar queries de productos relacionados
  invalidateProductRelated(id: string): void {
    this.queryClient.invalidateQueries({ queryKey: ['products-equal', id] });
    this.queryClient.invalidateQueries({ queryKey: ['products-rec', id] });
  }

  // Prefetch de la siguiente página
  prefetchNextPage(page: number, items: number, filters: any = {}): void {
    const nextPage = page + 1;
    const queryKey = ['products-public', nextPage, items, filters];

    this.queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const body = { page: nextPage, items, ...filters };
        return await lastValueFrom(
          this.http.post<ProdsResp>(`${this.apiUrl}scraping/products-public`, body).pipe(
            catchError(error => throwError(() => ({ error: error.error })))
          )
        );
      },
      staleTime: 1000 * 60 * 2
    });
  }

  // Helper para refrescar datos manualmente
  refetchLatestResults(): void {
    this.queryClient.invalidateQueries({ queryKey: ['latest-results'] });
  }

  refetchLatestResultsPublic(): void {
    this.queryClient.invalidateQueries({ queryKey: ['latest-results-public'] });
  }

  // Helper para obtener datos del cache sin hacer fetch
  getCachedLatestResults(): Product[] | undefined {
    return this.queryClient.getQueryData(['latest-results']);
  }

  getCachedLatestResultsPublic(): ProductPublic[] | undefined {
    return this.queryClient.getQueryData(['latest-results-public']);
  }

  getCachedPriceHistory(id: string): PriceHistory | undefined {
    return this.queryClient.getQueryData(['price-history', id]);
  }
}
