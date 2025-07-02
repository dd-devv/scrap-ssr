import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { SearchService } from '../../../services/search.service';
import { SkeletonProdComponent } from '../../../ui/skeleton-prod/skeleton-prod.component';
import { CardModule } from 'primeng/card';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import AuthService from '../../auth/services/auth.service';
import { Button } from 'primeng/button';
import ProductService from '../services/product.service';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FloatLabel } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Location } from '@angular/common';

@Component({
  selector: 'app-search-results',
  imports: [
    SkeletonProdComponent,
    CardModule,
    TitleCasePipe,
    CurrencyPipe,
    RouterLink,
    Button,
    Toast,
    FloatLabel,
    FormsModule,
    InputTextModule
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
  isLoading = this.searchService.isLoading;
  results = this.searchService.results;

  term = '';

  ngOnInit(): void {
    this.authService.checkAuthStatus().subscribe();

    // Obtener el término de búsqueda de los query params
    this.route.queryParams.subscribe(params => {
      const searchQuery = params['q'];
      if (searchQuery) {
        // Normalizar el texto (decodificar URL y limpiar)
        this.term = this.normalizeSearchTerm(searchQuery);

        // Limpiar los query params de la URL
        this.clearQueryParams();

        // Realizar la búsqueda si el término es válido
        if (this.term.length > 7) {
          this.searchTerm();
        } else {
          this.isLoading.set(false);
        }
      }
    });

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

  private clearQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  searchTerm() {
    this.loading.set(true);
    this.searchService.searTerm(this.term).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        console.log('error', err);
      }
    });
  }

  clearFilters() {
    this.term = '';
  }

  truncateText(text: string, length: number = 40): string {
    if (text.length <= length) {
      return text;
    }
    return text.substring(0, length) + '...';
  }

  registrarUrl(url: string) {
    this.productService.registerUrl([url], '10min').subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Registrado correctamente',
          life: 3000
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error!',
          detail: 'Error al registrar',
          life: 3000
        });
      }
    });
  }
}
