import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal } from '@angular/core';
import ProductService from '../services/product.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CurrencyPipe, isPlatformBrowser, TitleCasePipe } from '@angular/common';
import { BadgeModule } from 'primeng/badge';
import { TimeAgoPipe } from '../../../pipes/timeAgo.pipe';
import { Skeleton } from 'primeng/skeleton';
import { ExtractDomainPipe } from '../../../pipes/extract-domain.pipe';
import { RouterLink } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { Tooltip } from 'primeng/tooltip';
import AuthService from '../../auth/services/auth.service';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { PaginatePipe } from '../../../pipes/paginate.pipe';
import { ProductPublic } from '../interfaces';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SkeletonProdComponent } from "../../../ui/skeleton-prod/skeleton-prod.component";
import { DrawerModule } from 'primeng/drawer';


@Component({
  selector: 'app-offers',
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
    PaginatePipe,
    InputTextModule,
    FloatLabelModule,
    SkeletonProdComponent,
    DrawerModule
],
  providers: [ExtractDomainPipe, MessageService],
  templateUrl: './offers.component.html',
  styleUrl: './offers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class OffersComponent {
  productService = inject(ProductService);
  extractDomainPipe = inject(ExtractDomainPipe);
  private messageService = inject(MessageService);
  authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  selectedStore: string | null = null;
  availableStores: string[] = [];
  searchTerm: string = '';

  componentLoading = this.productService.isLoading;
  products = this.productService.productsPublic;
  filteredProducts = signal<ProductPublic[]>([]);
  isLoading = this.productService.isLoading;

  estadosOfertas = signal<{ [key: string]: boolean }>({});

  currentPage = 1;
  pageSize = 16;

  selectedDiscountRange: any = null;
  discountRanges = [
    { label: '10% o más', value: { min: 10, max: 100 } },
    { label: '20% o más', value: { min: 20, max: 100 } },
    { label: '30% o más', value: { min: 30, max: 100 } },
    { label: '40% o más', value: { min: 40, max: 100 } },
    { label: '50% o más', value: { min: 50, max: 100 } },
    { label: '60% o más', value: { min: 60, max: 100 } },
    { label: '70% o más', value: { min: 70, max: 100 } },
    { label: '80% o más', value: { min: 80, max: 100 } },
    { label: '90% o más', value: { min: 90, max: 100 } }
  ];
  showSidebar = false;
  sidebarVisible = false;
  drawerVisible = false;

  loadStores() {
    const stores = new Set<string>();
    this.products().forEach(product => {
      const domain = this.extractDomainPipe.transform(product.url); // Usar el pipe
      if (domain) stores.add(domain);
    });
    this.availableStores = Array.from(stores).sort();
  }

  ngOnInit(): void {

    this.obteneOfertas();
  }

  obteneOfertas() {
    this.productService.getLatestResultsPublic().subscribe({
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



  // Modifica el método applyFilter para incluir el filtro por descuento
  // applyFilter() {
  //   this.currentPage = 1;

  //   let filtered = this.products();

  //   // Aplicar filtro por tienda si está seleccionada
  //   if (this.selectedStore) {
  //     filtered = filtered.filter(product =>
  //       this.extractDomainPipe.transform(product.url) === this.selectedStore
  //     );
  //   }

  //   // Aplicar filtro por búsqueda si hay término
  //   if (this.searchTerm.trim()) {
  //     const searchTermLower = this.searchTerm.toLowerCase().trim();
  //     filtered = filtered.filter(product =>
  //       product.productTitle.toLowerCase().includes(searchTermLower)
  //     );
  //   }

  //   // Aplicar filtro por rango de descuento
  //   if (this.selectedDiscountRange) {
  //     filtered = filtered.filter(product => {
  //       const discount = product.discountPercentage;
  //       return discount >= this.selectedDiscountRange.value.min && 
  //             discount <= this.selectedDiscountRange.value.max;
  //     });
  //   }

  //   this.filteredProducts.set(filtered);
  // }
applyFilter() {
  console.log('Aplicando filtros:', {
    searchTerm: this.searchTerm,
    selectedStore: this.selectedStore,
    selectedDiscountRange: this.selectedDiscountRange
  });

  this.currentPage = 1;
  let filtered = this.products();

  console.log('Productos iniciales:', filtered.length);

  // Aplicar filtro por tienda si está seleccionada
  if (this.selectedStore) {
    filtered = filtered.filter(product =>
      this.extractDomainPipe.transform(product.url) === this.selectedStore
    );
    console.log('Después del filtro por tienda:', filtered.length);
  }

  // Aplicar filtro por búsqueda si hay término
  if (this.searchTerm.trim()) {
    const searchTermLower = this.searchTerm.toLowerCase().trim();
    filtered = filtered.filter(product =>
      product.productTitle.toLowerCase().includes(searchTermLower)
    );
    console.log('Después del filtro por búsqueda:', filtered.length);
  }

  // Aplicar filtro por rango de descuento - VERSIÓN MÁS DEFENSIVA
  if (this.selectedDiscountRange && 
      this.selectedDiscountRange.value && 
      typeof this.selectedDiscountRange.value.min === 'number' && 
      typeof this.selectedDiscountRange.value.max === 'number') {
    console.log('Aplicando filtro de descuento:', this.selectedDiscountRange);
    filtered = filtered.filter(product => {
      // const discount = product.discountPercentage;
      const discount = Number(product.discountPercentage);
      // Verificar que el descuento sea un número válido
      if (typeof discount !== 'number' || isNaN(discount)) {
        console.log(`Producto con descuento inválido: ${product.productTitle}, descuento: ${discount}`);
        return false;
      }
      
      const inRange = discount >= this.selectedDiscountRange.value.min && 
                     discount <= this.selectedDiscountRange.value.max;
      console.log(`Producto: ${product.productTitle}, Descuento: ${discount}%, En rango: ${inRange}`);
      return inRange;
    });
    console.log('Después del filtro por descuento:', filtered.length);
  }

  this.filteredProducts.set(filtered);
  console.log('Productos filtrados finales:', this.filteredProducts().length);
}


  // clearFilters(): void {
  //   this.searchTerm = '';
  //   this.selectedStore = null;
  //   this.selectedDiscountRange = null;
  //   this.applyFilter();
  //   this.currentPage = 1;

  //   if (isPlatformBrowser(this.platformId)) {
  //     window.scrollTo({ top: 0, behavior: 'smooth' });
  //   }
  // }
 clearFilters(): void {
  this.searchTerm = '';
  this.selectedStore = null;
  this.selectedDiscountRange = null; // Asegurar que sea null, no undefined
  this.applyFilter();
  this.currentPage = 1;

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
        this.obteneOfertas();
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
        this.obteneOfertas();
      }
    });
  }
}
