import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { SearchService } from '../../../services/search.service';
import { SkeletonProdComponent } from '../../../ui/skeleton-prod/skeleton-prod.component';
import { CardModule } from 'primeng/card';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import AuthService from '../../auth/services/auth.service';
import { ButtonModule } from 'primeng/button';
import ProductService from '../services/product.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Location } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { ExtractDomainPipe } from '../../../pipes/extract-domain.pipe';
import { TimeAgoPipe } from '../../../pipes/timeAgo.pipe';
import { firstValueFrom } from 'rxjs';
import { ProductPublic } from '../interfaces';
import { BadgeModule } from 'primeng/badge';
import { FieldsetModule } from 'primeng/fieldset';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    SkeletonProdComponent,
    CardModule,
    TitleCasePipe,
    CurrencyPipe,
    RouterLink,
    ButtonModule,
    ToastModule,
    FloatLabelModule,
    FormsModule,
    InputTextModule,
    TooltipModule,
    ExtractDomainPipe,
    TimeAgoPipe,
    BadgeModule,
    FieldsetModule
  ],
  providers: [MessageService],
  templateUrl: './search-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SearchResultsComponent implements OnInit {
  searchService = inject(SearchService);
  authService = inject(AuthService);
  productService = inject(ProductService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  loading = signal(false);
  loadingUrls = signal<Set<string>>(new Set());
  isLoading = this.searchService.isLoading;
  results = this.searchService.results;
  productsFound = this.searchService.productsFound;
  sortOrder = signal<'asc' | 'desc'>('desc');
  estadosOfertas = signal<{ [key: string]: boolean }>({});
  isAuthenticated = true;

  term = '';

  sortedResults = computed(() => {
    const results = this.results();
    if (this.sortOrder() === 'asc') {
      return [...results].sort((a, b) => (Number(a.price) || Infinity) - (Number(b.price) || Infinity));
    } else {
      return [...results].sort((a, b) => (Number(b.price) || Infinity) - (Number(a.price) || Infinity));
    }
  });

  ngOnInit(): void {
    this.checkAuth();

    this.route.queryParams.subscribe(params => {
      const searchQuery = params['q'];
      if (searchQuery) {
        this.term = this.normalizeSearchTerm(searchQuery);

        if (this.term.length > 7) {
          this.searchTerm();
        } else {
          this.isLoading.set(false);
        }
      }
    });
  }

  private async checkAuth(): Promise<void> {
    try {
      this.isAuthenticated = await firstValueFrom(this.authService.checkAuthStatus());
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  }

  ngOnDestroy(): void {
    this.results.set([]);
  }

  private normalizeSearchTerm(term: string): string {
    try {
      let normalized = decodeURIComponent(term);
      normalized = normalized.trim();
      normalized = normalized.replace(/\s+/g, ' ');
      return normalized;
    } catch (error) {
      console.warn('Error al normalizar el término de búsqueda:', error);
      return term;
    }
  }

  searchTerm() {
    this.loading.set(true);
    const queryParams: any = {};
    this.searchService.searTerm(this.term).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        console.log('error', err);
      }
    });

    this.searchService.searTracks(this.term).subscribe({
      next: (res) => {

        if (this.isAuthenticated) {
          this.loadProductStates(res);
        }
      }
    });

    queryParams['q'] = this.term;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  clearFilters() {
    this.term = '';
  }

  toggleSortOrder() {
    this.sortOrder.update(order => order === 'asc' ? 'desc' : 'asc');
  }

  truncateText(text: string, length: number = 70): string {
    if (text.length <= length) {
      return text;
    }
    return text.substring(0, length) + '...';
  }

  isUrlLoading(url: string): boolean {
    return this.loadingUrls().has(url);
  }

  private addLoadingUrl(url: string): void {
    this.loadingUrls.update(urls => {
      const newSet = new Set(urls);
      newSet.add(url);
      return newSet;
    });
  }

  private removeLoadingUrl(url: string): void {
    this.loadingUrls.update(urls => {
      const newSet = new Set(urls);
      newSet.delete(url);
      return newSet;
    });
  }

  registrarUrl(url: string) {
    this.addLoadingUrl(url);

    this.productService.registerUrl([url], '10min').subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Registrado correctamente',
          life: 3000
        });
        this.removeLoadingUrl(url);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error!',
          detail: 'Error al registrar',
          life: 3000
        });
        this.removeLoadingUrl(url);
      }
    });
  }

  private loadProductStates(products: ProductPublic[]): void {
    products.forEach(prod => {
      this.productService.getMyJob(prod.urlId).subscribe({
        next: (res) => {
          this.estadosOfertas.update(estados => ({
            ...estados,
            [prod.urlId]: res.myjob
          }));
        },
        error: (err) => {
          this.estadosOfertas.update(estados => ({
            ...estados,
            [prod.urlId]: false
          }));
        }
      });
    });
  }


  addUrlForMe(sourceJobId: string, urlId: string): void {
    this.isLoading.set(true);
    this.productService.addUrlForMe(sourceJobId, urlId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Agregado a tu seguimiento',
          life: 3000
        });
        this.searchService.searTracks(this.term).subscribe();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.error || 'Error al agregar el producto',
          life: 3000
        });
        this.isLoading.set(false);
      }
    });
  }

  deleteUrl(urlId: string): void {
    this.productService.deleteUrl(urlId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Dejaste de seguir este producto',
          life: 3000
        });
        this.searchService.searTracks(this.term).subscribe();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.error || 'Error al dejar de seguir el producto',
          life: 3000
        });
      }
    });
  }

  getMyJob(urlId: string): boolean {
    return this.estadosOfertas()[urlId] || false;
  }
}
