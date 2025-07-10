import { CurrencyPipe, isPlatformBrowser, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TimeAgoPipe } from '../../../pipes/timeAgo.pipe';
import { BadgeModule } from 'primeng/badge';
import { ExtractDomainPipe } from '../../../pipes/extract-domain.pipe';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { Tooltip } from 'primeng/tooltip';
import { Toast } from 'primeng/toast';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { PaginatePipe } from '../../../pipes/paginate.pipe';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageService } from 'primeng/api';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import ProductService from '../services/product.service';
import AuthService from '../../auth/services/auth.service';
import { ProductPublic } from '../interfaces';
import { SkeletonProdComponent } from '../../../ui/skeleton-prod/skeleton-prod.component';
import { CategoryService } from '../services/category.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-products-all',
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    TitleCasePipe,
    CurrencyPipe,
    TimeAgoPipe,
    BadgeModule,
    ExtractDomainPipe,
    RouterLink,
    DropdownModule,
    FormsModule,
    Tooltip,
    Toast,
    PaginationComponent,
    InputTextModule,
    FloatLabelModule,
    SkeletonProdComponent
  ],
  providers: [ExtractDomainPipe, MessageService],
  templateUrl: './products-all.component.html',
  styleUrl: './products-all.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProductsAllComponent implements OnInit {
  private productService = inject(ProductService);
  private extractDomainPipe = inject(ExtractDomainPipe);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private categoryService = inject(CategoryService);

  // Estado del componente
  selectedStore: string | null = null;
  availableStores: string[] = [
    'falabella',
    'mercadolibre',
    'oechsle',
    'plazavea',
    'platanitos',
    'promart',
    'sodimac',
    'tottus',
    'linio',
    'inkafarma',
    'mifarma',
    'vivanda',
    'shopstar',
    'metro',
    'carsa',
    'aruma',
    'romestore',
    'coolbox',
    'tiendasishop',
    'realplaza',
    'wong',
    'hm',
    'cuidafarma',
    'hushpuppies',
    'miniso',
    'tiendamia'
  ];
  searchTerm: string = '';
  isLoading = this.productService.isLoading;
  products = this.productService.productsAll;
  filteredProducts = signal<ProductPublic[]>([]);
  totalPages = signal(1);
  currentPage = 1;
  pageSize = 16;
  categorysUser = this.categoryService.categorysUser;
  estadosOfertas = signal<{ [key: string]: boolean }>({});
  isAuthenticated = false;

  ngOnInit(): void {
    this.isLoading.set(true);
    this.route.queryParams
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(params => {
        this.currentPage = params['page'] ? +params['page'] : 1;
        this.selectedStore = params['store'] || null;
        this.searchTerm = params['search'] || '';
        this.loadProducts();
      });

    this.checkAuthAndLoad();
  }

  private async checkAuthAndLoad(): Promise<void> {
    try {
      this.isAuthenticated = await firstValueFrom(this.authService.checkAuthStatus());
      if (this.isAuthenticated) {
        this.loadUserCategories();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  }

  private loadUserCategories(): void {
    this.categoryService.getUserCategorys().subscribe({
      next: () => {
        this.categorysUser.set(this.categoryService.categorysUser());
      },
      error: (err) => {
        console.error('Error loading user categories:', err);
      }
    });
  }

  private loadProducts(): void {
    const filters = {
      searchTerm: this.searchTerm,
      store: this.selectedStore
    };

    this.productService.getProductsPublic(
      this.currentPage,
      this.pageSize,
      filters
    ).subscribe({
      next: (res) => {
        this.totalPages.set(res.pages);
        this.filteredProducts.set(res.products);

        if (this.isAuthenticated) {
          this.loadProductStates(res.products);
        }
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los productos',
          life: 3000
        });
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

  onSearchChange(): void {
    this.currentPage = 1;
    this.updateQueryParams();
  }

  onStoreChange(): void {
    this.currentPage = 1;
    this.updateQueryParams();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateQueryParams();
    this.scrollToTop();
  }

  private updateQueryParams(): void {
    const queryParams: any = {};

    if (this.currentPage >= 1) queryParams.page = this.currentPage;
    if (this.selectedStore) queryParams.store = this.selectedStore;
    if (this.searchTerm.trim()) queryParams.search = this.searchTerm.trim();
    if (this.searchTerm === '') {
      queryParams.search = null;
      this.loadProducts();
    }
    if (this.selectedStore === null) {
      queryParams.store = null;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStore = null;
    this.currentPage = 1;
    this.updateQueryParams();
    this.scrollToTop();
  }

  private scrollToTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  redirect(url: string): void {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }

  truncateText(text: string, length: number = 40): string {
    return text.length <= length ? text : `${text.substring(0, length)}...`;
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
        this.loadProducts();
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
        this.loadProducts();
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
