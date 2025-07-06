import { CurrencyPipe, isPlatformBrowser, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TimeAgoPipe } from '../../../pipes/timeAgo.pipe';
import { BadgeModule } from 'primeng/badge';
import { ExtractDomainPipe } from '../../../pipes/extract-domain.pipe';
import { RouterLink } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { Tooltip } from 'primeng/tooltip';
import { Toast } from 'primeng/toast';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { PaginatePipe } from '../../../pipes/paginate.pipe';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageService } from 'primeng/api';
import ProductService from '../services/product.service';
import AuthService from '../../auth/services/auth.service';
import { ProductPublic } from '../interfaces';
import { SkeletonProdComponent } from '../../../ui/skeleton-prod/skeleton-prod.component';
import { CategoryService } from '../services/category.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-products-all',
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
    PaginatePipe,
    InputTextModule,
    FloatLabelModule,
    SkeletonProdComponent
  ],
  providers: [ExtractDomainPipe, MessageService],
  templateUrl: './products-all.component.html',
  styleUrl: './products-all.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProductsAllComponent {
  productService = inject(ProductService);
  extractDomainPipe = inject(ExtractDomainPipe);
  private messageService = inject(MessageService);
  authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  selectedStore: string | null = null;
  availableStores: string[] = [];
  searchTerm: string = '';

  componentLoading = this.productService.isLoading;
  products = this.productService.productsAll;
  filteredProducts = signal<ProductPublic[]>([]);
  isLoading = this.productService.isLoading;

  categoryService = inject(CategoryService);
  categorysUser = this.categoryService.categorysUser;

  estadosOfertas = signal<{ [key: string]: boolean }>({});

  currentPage = 1;
  pageSize = 16;

  loadStores() {
    const stores = new Set<string>();
    this.products().forEach(product => {
      const domain = this.extractDomainPipe.transform(product.url); // Usar el pipe
      if (domain) stores.add(domain);
    });
    this.availableStores = Array.from(stores).sort();
  }

  async ngOnInit(): Promise<void> {
    // Primero verificar autenticación
    const isAuthenticated = await firstValueFrom(this.authService.checkAuthStatus());

    // Luego ejecutar las queries
    this.obteneProductsAll();

    if (isAuthenticated) {
      this.getCategorysUser();
    }
  }

  getCategorysUser() {
    this.categoryService.getUserCategorys().subscribe({
      next: () => {
        this.categorysUser.set(this.categoryService.categorysUser());
      }
    });
  }

  obteneProductsAll() {
    this.productService.getProductsPublic().subscribe({
      next: (res) => {
        this.loadStores();
        this.products().forEach(prod => {
          this.cargarEstadoJobs(prod.urlId);
        });


        this.filteredProducts.set(this.products());
        this.applyFilter();
      },
      error: (err) => {
        console.error('Error al cargar ofertas:', err);
      }
    });
  }

  // applyFilter() {
  //   this.currentPage = 1;
  //   if (!this.selectedStore) {
  //     this.filteredProducts.set(this.products());
  //     return;
  //   }
  //   this.filteredProducts.set(this.products().filter(product =>
  //     this.extractDomainPipe.transform(product.url) === this.selectedStore
  //   ));
  // }
  applyFilter() {
    this.currentPage = 1;

    let filtered = this.products();

    // Aplicar filtro por tienda si está seleccionada
    if (this.selectedStore) {
      filtered = filtered.filter(product =>
        this.extractDomainPipe.transform(product.url) === this.selectedStore
      );
    }

    // Aplicar filtro por búsqueda si hay término
    if (this.searchTerm.trim()) {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.productTitle.toLowerCase().includes(searchTermLower)
      );
    }

    // Ordenar productos por categorías del usuario (si está autenticado)
    if (this.authService.isAuthenticatedUser() && this.categorysUser().length > 0) {
      filtered = this.sortProductsByUserCategories(filtered);
    }

    this.filteredProducts.set(filtered);
  }

  private sortProductsByUserCategories(products: ProductPublic[]): ProductPublic[] {
    const userCategories = this.categorysUser();

    // Separar productos que coinciden y no coinciden con las categorías del usuario
    const matchingProducts: ProductPublic[] = [];
    const nonMatchingProducts: ProductPublic[] = [];

    products.forEach(product => {
      // Si no tiene categorías, va directamente a no coincidentes
      if (product.categories.every(cat => !cat || cat.trim() === '')) {
        nonMatchingProducts.push(product);
        return;
      }

      const hasMatchingCategory = product.categories.some(productCategory =>
        userCategories.some(userCategory =>
          productCategory.toLowerCase().includes(userCategory.toLowerCase()) ||
          userCategory.toLowerCase().includes(productCategory.toLowerCase())
        )
      );

      if (hasMatchingCategory) {
        matchingProducts.push(product);
      } else {
        nonMatchingProducts.push(product);
      }
    });

    // Retornar productos coincidentes primero, seguidos de los no coincidentes
    return [...matchingProducts, ...nonMatchingProducts];
  }

  // Método opcional para obtener información de coincidencia de categorías
  hasMatchingCategory(product: ProductPublic): boolean {
    if (!this.authService.isAuthenticatedUser() || this.categorysUser().length === 0) {
      return false;
    }

    const userCategories = this.categorysUser();
    return product.categories.some(productCategory =>
      userCategories.some(userCategory =>
        productCategory.toLowerCase().includes(userCategory.toLowerCase()) ||
        userCategory.toLowerCase().includes(productCategory.toLowerCase())
      )
    );
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStore = null;
    this.applyFilter();
    this.currentPage = 1; // Resetear a la primera página

    // Opcional: hacer scroll al inicio
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts().length / this.pageSize);
  }

  onPageChange(page: number): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 10, behavior: 'smooth' });
    }
    this.currentPage = page;
  }

  redirect(url: string) {
    if (typeof window !== 'undefined') {
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.focus();
      }
    }
  }

  truncateText(text: string, length: number = 40): string {
    if (text.length <= length) {
      return text;
    }
    return text.substring(0, length) + '...';
  }

  addUrlForMe(sourceJobId: string, urlId: string) {
    this.isLoading.set(true);
    this.productService.addUrlForMe(sourceJobId, urlId).subscribe({
      next: (response) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Agregado a tu seguimiento', life: 3000 });
        this.obteneProductsAll();
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error.error, life: 3000 });
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });

  }

  cargarEstadoJobs(urlId: string): void {
    this.productService.getMyJob(urlId).subscribe({
      next: (res) => {
        // Actualizar la señal con el nuevo estado
        this.estadosOfertas.update(estados => ({
          ...estados,
          [urlId]: res.myjob
        }));
      },
      error: (err) => {
        // En caso de error, marcar como false
        this.estadosOfertas.update(estados => ({
          ...estados,
          [urlId]: false
        }));
      }
    });
  }

  // Método para obtener el estado (usa la señal)
  getMyJob(urlId: string): boolean {
    return this.estadosOfertas()[urlId] || false;
  }

  //Para dejar de seguir
  deleteUrl(urlId: string): void {
    this.productService.deleteUrl(urlId).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Dejaste de seguir', life: 3000 });
        this.obteneProductsAll();
      }
    });
  }
}
