import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import ProductService from '../services/product.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CurrencyPipe, NgClass, TitleCasePipe } from '@angular/common';
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
import { catchError, map, Observable, of } from 'rxjs';

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
    Skeleton,
    ExtractDomainPipe,
    RouterLink,
    DropdownModule,
    FormsModule,
    Tooltip,
    Toast
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
  selectedStore: string | null = null;
  availableStores: string[] = [];

  products = this.productService.productsPublic;
  isLoading = this.productService.isLoading;

  estadosOfertas = signal<{ [key: string]: boolean }>({});


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

      },
      error: (err) => {
        console.error('Error al cargar ofertas:', err);
      }
    });
  }

  get filteredProducts() {
    if (!this.selectedStore) {
      return this.products();
    }
    return this.products().filter(product =>
      this.extractDomainPipe.transform(product.url) === this.selectedStore
    );
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
    this.productService.addUrlForMe(sourceJobId, urlId).subscribe({
      next: (response) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Agregado a tu seguimiento', life: 3000 });
        this.obteneOfertas();
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error.error, life: 3000 });
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
        console.error('Error al obtener estado de comandas:', err);
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
