import { ChangeDetectionStrategy, Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Tooltip } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import ProductService from '../services/product.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { CurrencyPipe, isPlatformBrowser, NgClass, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TimeAgoPipe } from '../../../pipes/timeAgo.pipe';
import AuthService from '../../auth/services/auth.service';
import { SubscriptionService } from '../services/subscription.service';
import { Skeleton } from 'primeng/skeleton';
import { ExtractDomainPipe } from '../../../pipes/extract-domain.pipe';
import { DropdownModule } from 'primeng/dropdown';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { PaginatePipe } from '../../../pipes/paginate.pipe';
import { Product } from '../interfaces';

@Component({
  selector: 'app-products',
  imports: [
    ButtonModule,
    Ripple,
    Dialog,
    InputTextModule,
    Tooltip,
    FormsModule,
    TextareaModule,
    FloatLabel,
    Toast,
    CardModule,
    TitleCasePipe,
    CurrencyPipe,
    NgClass,
    RouterLink,
    ConfirmDialog,
    TimeAgoPipe,
    Skeleton,
    ExtractDomainPipe,
    DropdownModule,
    PaginationComponent,
    PaginatePipe
  ],
  providers: [MessageService, ConfirmationService, ExtractDomainPipe],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProductsComponent implements OnInit {
  productService = inject(ProductService);
  authService = inject(AuthService);
  subscriptionService = inject(SubscriptionService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  extractDomainPipe = inject(ExtractDomainPipe);
  private platformId = inject(PLATFORM_ID);

  visible = signal(false);
  visibleSubscription = signal(false);
  loading = signal(false);
  disabled = signal(false);
  componentLoading = this.productService.isLoading;
  products = this.productService.productsUser;
  filteredProducts = signal<Product[]>([]);

  // Filtro por tienda
  selectedStore: string | null = null;
  availableStores: string[] = [];

  url: string = '';
  urlId: string = '';

  montoSubscription: number = 10;
  tipoSubscription: string = 'Basic';
  loadingSubscription = signal(false);

  currentPage = 1;
  pageSize = 8;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.loadProducts();
    }
  }

  loadProducts() {
    this.productService.getLatestResults().subscribe({
      next: () => {
        this.loadStores();
        this.filteredProducts.set(this.products());
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

  // Métodos para el filtro por tienda
  loadStores() {
    const stores = new Set<string>();
    this.products().forEach(product => {
      const domain = this.extractDomainPipe.transform(product.url);
      if (domain) stores.add(domain);
    });
    this.availableStores = Array.from(stores).sort();
  }

  applyFilter() {
    this.currentPage = 1;
    if (!this.selectedStore) {
      this.filteredProducts.set(this.products());
      return;
    }
    this.filteredProducts.set(this.products().filter(product =>
      this.extractDomainPipe.transform(product.url) === this.selectedStore
    ));
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

  evaluateUrl() {
    const supportedDomains = [
      'sodimac',
      'tottus',
      'linio',
      'falabella',
      'ripley',
      'platanitos',
      'oechsle',
      'mercadolibre',
      'plazavea',
      'shopstar',
      'vivanda',
      'promart',
      'mifarma',
      'inkafarma',
    ];

    const isDomainSupported = supportedDomains.some(domain =>
      this.url.toLowerCase().includes(domain)
    );

    this.disabled.set(!isDomainSupported);
  }

  registrarUrl() {
    this.loading.set(true);
    this.productService.registerUrl([this.url], '10min').subscribe({
      next: (res) => {
        this.loading.set(false);
        this.url = '';
        this.closeDialog();
        this.loadProducts();
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Registrado correctamente', life: 3000 });
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error!', detail: 'Error al registrar', life: 3000 });
      }
    });
  }

  showDialog() {
    this.visible.set(true);
  }

  closeDialog() {
    this.visible.set(false);
  }

  showDialogSubscription() {
    this.visibleSubscription.set(true);
  }

  closeDialogSubscription() {
    this.visibleSubscription.set(false);
  }

  confirm(title: string, url: string, urlId: string) {
    this.urlId = urlId;
    this.confirmationService.confirm({
      header: `¿Comprar ${title}?`,
      message: 'Por favor confirma para dejar de hacer seguimiento al producto',
      accept: () => {
        if (typeof window !== 'undefined') {
          const newWindow = window.open(url, '_blank');
          if (newWindow) {
            newWindow.focus();
          }
        }
        this.deleteUrl();
      },
      reject: () => { },
    });
  }

  deleteUrl(): void {
    this.productService.deleteUrl(this.urlId).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto quitado con éxito', life: 3000 });
        this.loadProducts();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error!', detail: 'Error al eliminar el producto', life: 3000 });
      }
    });
  }

  truncateText(text: string, length: number = 40): string {
    if (text.length <= length) {
      return text;
    }
    return text.substring(0, length) + '...';
  }

  calcularPrecioPromedioPonderado(fechas: Date[], precios: number[]): number {
    if (fechas.length !== precios.length || fechas.length < 2) {
      throw new Error("Los arreglos deben tener igual longitud y al menos 2 elementos");
    }

    let sumaPesoPrecio = 0;
    let sumaDuracion = 0;

    for (let i = 0; i < fechas.length - 1; i++) {
      const fechaInicio = new Date(fechas[i]);
      const fechaFin = new Date(fechas[i + 1]);

      const duracion = (fechaFin.getTime() - fechaInicio.getTime()) / 1000;

      sumaPesoPrecio += precios[i] * duracion;
      sumaDuracion += duracion;
    }

    return sumaDuracion === 0 ? 0 : sumaPesoPrecio / sumaDuracion;
  }

  insertSubscription() {
    this.loadingSubscription.set(true);
    this.subscriptionService.registerSubcription(this.montoSubscription, this.tipoSubscription).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.message, life: 3000 });
        this.subscriptionService.getSubscriptionStatus().subscribe();
        this.loadingSubscription.set(false);
        this.closeDialogSubscription();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error!', detail: err.error.message, life: 3000 });
        this.loadingSubscription.set(false);
      }
    });
  }
}
