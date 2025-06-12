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
import { CommonModule, isPlatformBrowser, CurrencyPipe, NgClass, TitleCasePipe } from '@angular/common'; // Importa CommonModule aquí
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
import { CarouselModule } from 'primeng/carousel'; // Agrega esto
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-products',
  imports: [
    CommonModule, // Agrega CommonModule aquí
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
    PaginatePipe,
    CarouselModule,
    FloatLabelModule
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
  searchTerm: string = '';

    // Nuevas propiedades para la validación de URL
  private hasUrl = signal(false);
  private isSupported = signal(false);

  montoSubscription: number = 10;
  tipoSubscription: string = 'Basic';
  loadingSubscription = signal(false);

  currentPage = 1;
  pageSize = 16;

  supportedStores = [
    {
      name: 'Falabella',
      logo: 'assets/svg/falabella.svg',
      url: 'https://www.falabella.com.pe/falabella-pe',
      domain: 'falabella'
    },
    {
      name: 'Mercado Libre',
      logo: 'assets/svg/mercadolibre.svg',
      url: 'https://www.mercadolibre.com.pe/',
      domain: 'mercadolibre'
    },
    {
      name: 'Oechsle',
      logo: 'assets/svg/oechsle.svg',
      url: 'https://www.oechsle.pe/',
      domain: 'oechsle'
    },
    {
      name: 'Plaza Vea',
      logo: 'assets/svg/plazavea.svg',
      url: 'https://www.plazavea.com.pe/',
      domain: 'plazavea'
    },
    {
      name: 'Platanitos',
      logo: 'assets/svg/platanitos.svg',
      url: 'https://platanitos.com/pe',
      domain: 'platanitos'
    },
    {
      name: 'Promart',
      logo: 'assets/svg/promart.svg',
      url: 'https://www.promart.pe/',
      domain: 'promart'
    },
    {
      name: 'Sodimac',
      logo: 'assets/svg/sodimac.svg',
      url: 'http://sodimac.falabella.com.pe/sodimac-pe',
      domain: 'sodimac'
    },
    {
      name: 'Tottus',
      logo: 'assets/svg/tottus.svg',
      url: 'https://tottus.falabella.com.pe/tottus-pe',
      domain: 'tottus'
    },
    {
      name: 'Linio',
      logo: 'assets/svg/linio.svg',
      url: 'https://linio.falabella.com.pe/linio-pe',
      domain: 'linio'
    },
    {
      name: 'Inkafarma',
      logo: 'assets/svg/inkafarma.svg',
      url: 'https://inkafarma.pe/',
      domain: 'inkafarma'
    },
    {
      name: 'MiFarma',
      logo: 'assets/svg/mifarma.svg',
      url: 'https://www.mifarma.com.pe/',
      domain: 'mifarma'
    },
    {
      name: 'Vivanda',
      logo: 'assets/svg/vivanda.svg',
      url: 'https://www.vivanda.com.pe/',
      domain: 'vivanda'
    },
    {
      name: 'Shopstar',
      logo: 'assets/svg/shopstar.svg',
      url: 'https://www.shopstar.pe/',
      domain: 'shopstar'
    },
    {
      name: 'Metro',
      logo: 'assets/svg/metro.svg',
      url: 'https://www.metro.pe/',
      domain: 'metro'
    }
  ];

  // Opciones responsivas para el carousel
  responsiveOptions = [
    {
      breakpoint: '1199px',
      numVisible: 6,
      numScroll: 1
    },
    {
      breakpoint: '991px',
      numVisible: 4,
      numScroll: 1
    },
    {
      breakpoint: '767px',
      numVisible: 3,
      numScroll: 1
    }
  ];

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.loadProducts();
    }
  }
  openStore(url: string) {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
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
    
    this.filteredProducts.set(filtered);
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

  evaluateUrl() {
    const supportedDomains = [
      'sodimac',
      'tottus',
      'linio',
      'falabella',
      'platanitos',
      'oechsle',
      'mercadolibre',
      'plazavea',
      'shopstar',
      'vivanda',
      'promart',
      'mifarma',
      'inkafarma',
      'metro'
    ];

    const urlTrimmed = this.url.trim();
    this.hasUrl.set(urlTrimmed.length > 0);

    if (urlTrimmed.length === 0) {
      this.disabled.set(false);
      this.isSupported.set(false);
      return;
    }

    // Verificar si es una URL válida
    const isValidUrl = this.isValidHttpUrl(urlTrimmed);
    
    if (!isValidUrl) {
      this.disabled.set(true);
      this.isSupported.set(false);
      return;
    }

    const isDomainSupported = supportedDomains.some(domain =>
      urlTrimmed.toLowerCase().includes(domain)
    );

    this.disabled.set(!isDomainSupported);
    this.isSupported.set(isDomainSupported);
  }

  private isValidHttpUrl(string: string): boolean {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // Métodos para mostrar los mensajes
  showUnsupportedMessage(): boolean {
    return this.hasUrl() && !this.isSupported() && this.isValidHttpUrl(this.url.trim());
  }

  showSupportedMessage(): boolean {
    return this.hasUrl() && this.isSupported();
  }

  // Método para manejar el evento paste
  onPaste(event: ClipboardEvent) {
    setTimeout(() => {
      this.evaluateUrl();
    }, 10);
  }

  registrarUrl() {
    this.loading.set(true);
    this.productService.registerUrl([this.url], '10min').subscribe({
      next: (res) => {
        this.loading.set(false);
        this.url = '';
        this.hasUrl.set(false);
        this.isSupported.set(false);
        this.disabled.set(false);
        this.loadProducts();
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Éxito', 
          detail: 'Registrado correctamente', 
          life: 3000 
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error!', 
          detail: 'Error al registrar', 
          life: 3000 
        });
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
