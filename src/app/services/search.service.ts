import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { ProdsResp, ProductPublic, SearchReq, SearchRes } from '../modules/user/interfaces';
import { catchError, Observable, throwError, of } from 'rxjs';
import { TokenStorageService } from '../modules/auth/services/tokenStorage.service';
import { injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private tokenStorage = inject(TokenStorageService);
  private queryClient = injectQueryClient();

  readonly isLoading = signal<boolean>(false);
  readonly results = signal<SearchRes[]>([]);
  readonly productsFound = signal<ProductPublic[]>([]);

  private authToken = computed(() => this.tokenStorage.getToken());

  // ✅ Funciones privadas que hacen las requests
  private async fetchSearchTerm(term: string): Promise<SearchRes[]> {
    const searchData: SearchReq = { term };

    return await lastValueFrom(
      this.http.post<SearchRes[]>(`${this.apiUrl}search`, searchData, {
        headers: {
          Authorization: `Bearer ${this.authToken()}`
        }
      }).pipe(
        catchError(error => throwError(() => ({ error: error.error })))
      )
    );
  }

  private async fetchSearchTracks(term: string): Promise<ProductPublic[]> {
    const searchData: SearchReq = { term };

    return await lastValueFrom(
      this.http.post<ProductPublic[]>(`${this.apiUrl}search/tracks`, searchData, {
        headers: {
          Authorization: `Bearer ${this.authToken()}`
        }
      }).pipe(
        catchError(error => throwError(() => ({ error: error.error })))
      )
    );
  }

  // ✅ Método compatible que usa TanStack Query y retorna Observable
  searTerm(term: string): Observable<SearchRes[]> {
    this.isLoading.set(true);

    // Si ya está en caché, devuélvelo directo
    const cached = this.queryClient.getQueryData<SearchRes[]>(['search-term', term]);
    if (cached) {
      this.results.set(cached);
      this.isLoading.set(false);
      return of(cached);
    }

    // Si no está en caché, usar TanStack para guardar y devolver
    return new Observable<SearchRes[]>(subscriber => {
      this.queryClient.ensureQueryData({
        queryKey: ['search-term', term],
        queryFn: () => this.fetchSearchTerm(term),
        staleTime: 1000 * 60 * 5
      }).then(data => {
        this.results.set(data);
        this.isLoading.set(false);
        subscriber.next(data);
        subscriber.complete();
      }).catch(error => {
        this.isLoading.set(false);
        subscriber.error(error);
      });
    });
  }

  searTracks(term: string): Observable<ProductPublic[]> {
    const cached = this.queryClient.getQueryData<ProductPublic[]>(['search-tracks', term]);
    if (cached) {
      this.productsFound.set(cached);
      return of(cached);
    }

    return new Observable<ProductPublic[]>(subscriber => {
      this.queryClient.ensureQueryData({
        queryKey: ['search-tracks', term],
        queryFn: () => this.fetchSearchTracks(term),
        staleTime: 1000 * 60 * 5
      }).then(data => {
        this.productsFound.set(data);
        subscriber.next(data);
        subscriber.complete();
      }).catch(error => {
        subscriber.error(error);
      });
    });
  }

  invalidateSearchTermCache(term?: string) {
    this.queryClient.invalidateQueries({
      queryKey: term ? ['search-term', term] : ['search-term']
    });
  }

  invalidateSearchTracksCache(term?: string) {
    this.queryClient.invalidateQueries({
      queryKey: term ? ['search-tracks', term] : ['search-tracks']
    });
  }

  prefetchSearchTerm(term: string) {
    return this.queryClient.prefetchQuery({
      queryKey: ['search-term', term],
      queryFn: () => this.fetchSearchTerm(term),
      staleTime: 1000 * 60 * 5
    });
  }

  prefetchSearchTracks(term: string) {
    return this.queryClient.prefetchQuery({
      queryKey: ['search-tracks', term],
      queryFn: () => this.fetchSearchTracks(term),
      staleTime: 1000 * 60 * 5
    });
  }

  getSearchTermFromCache(term: string): SearchRes[] | undefined {
    return this.queryClient.getQueryData(['search-term', term]);
  }

  getSearchTracksFromCache(term: string): ProductPublic[] | undefined {
    return this.queryClient.getQueryData(['search-tracks', term]);
  }

  clearAllSearchCache() {
    this.queryClient.clear();
    this.results.set([]);
    this.productsFound.set([]);
  }
}
