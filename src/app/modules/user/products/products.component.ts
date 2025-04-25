import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
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
import { CurrencyPipe, DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TimeAgoPipe } from '../../../pipes/timeAgo.pipe';
import AuthService from '../../auth/services/auth.service';
import { SubscriptionService } from '../services/subscription.service';
import { Skeleton } from 'primeng/skeleton';
import { Message } from 'primeng/message';
import { ExtractDomainPipe } from '../../../pipes/extract-domain.pipe';

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
    Message,
    ExtractDomainPipe
  ],
  providers: [MessageService, ConfirmationService],
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
  visible = signal(false);
  visibleSubscription = signal(false);
  loading = signal(false);
  disabled = signal(false);
  componentLoading = signal(true);

  url: string = '';
  urlId: string = '';

  montoSubscription: number = 10;
  tipoSubscription: string = 'Basic';
  loadingSubscription = signal(false);

  ngOnInit(): void {
    // Solo cargar productos en el lado del cliente
    if (typeof window !== 'undefined') {
      this.loadProducts();
    } else {
      // Estamos en SSR, solo marcar como no cargando
      this.componentLoading.set(false);
    }
  }

  loadProducts() {
    this.componentLoading.set(true);
    this.productService.getLatestResults().subscribe({
      next: () => this.componentLoading.set(false),
      error: (err) => {
        console.error('Error loading products:', err);
        this.componentLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los productos',
          life: 3000
        });
      },
      complete: () => this.componentLoading.set(false)
    });
  }

  evaluateUrl() {
    const supportedDomains = [
      'falabella',
      'ripley',
      'platanitos',
      'oechsle',
      'mercadolibre',
      'plazavea'
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
        this.productService.getLatestResults().subscribe();
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
        // Abrir URL en una nueva pestaña de manera segura y compatible con SSR
        if (typeof window !== 'undefined') {
          const newWindow = window.open(url, '_blank');
          if (newWindow) {
            newWindow.focus();
          }
        }

        this.deleteUrl();
      },
      reject: () => {
      },
    });
  }

  deleteUrl(): void {
    this.productService.deleteUrl(this.urlId).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto quitado con éxito', life: 3000 });
        this.productService.getLatestResults().subscribe();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error!', detail: 'Error al eliminar el producto', life: 3000 });
      }
    });
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
