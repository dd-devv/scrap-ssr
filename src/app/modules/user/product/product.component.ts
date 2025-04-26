import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe, isPlatformBrowser, SlicePipe } from '@angular/common';
import { switchMap, tap } from 'rxjs/operators';
import ProductService from '../services/product.service';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Skeleton } from 'primeng/skeleton';
import { ExtractDomainPipe } from '../../../pipes/extract-domain.pipe';
import { Meta, Title } from '@angular/platform-browser'; // Importar Meta y Title

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    CommonModule,
    Card,
    SlicePipe,
    CurrencyPipe,
    Button,
    ChartModule,
    ConfirmDialog,
    Skeleton,
    ExtractDomainPipe
  ],
  providers: [ConfirmationService],
  templateUrl: './product.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProductComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private confirmationService = inject(ConfirmationService);
  productService = inject(ProductService);
  router = inject(Router);
  private meta = inject(Meta); // Inyectar servicio Meta
  private title = inject(Title); // Inyectar servicio Title

  // Signal para almacenar el id
  productId = signal<string | null>(null);
  data: any;
  options: any;
  platformId = inject(PLATFORM_ID);
  urlId: string = '';

  constructor(private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      tap(params => {
        const id = params.get('id');
        this.productId.set(id);
      }),
      switchMap(() => {
        const id = this.productId() ?? '';
        return this.productService.getPriceHistory(id);
      }),
      // Añadir este operador para procesar la respuesta
      tap(response => {
        if (response && response.priceHistory) {
          this.updateChart(response.priceHistory);

          // Actualizar meta tags con la información del producto
          if (response.productInfo) {
            this.updateMetaTags(response.productInfo);
          }
        }
      })
    ).subscribe();

    // Inicializar el gráfico con datos vacíos
    this.initChart();
  }

  // Método para actualizar las meta tags con la información del producto
  private updateMetaTags(productInfo: any): void {
    if (!productInfo) return;

    // Establecer el título de la página con el nombre del producto
    this.title.setTitle(`AcllaBay - ${productInfo.title}`);

    // Obtener una descripción limpia
    const description = productInfo.description ?
        `${productInfo.description.slice(0, 150)}...` :
        'Monitoreo de precios y alertas de WhatsApp para este producto en AcllaBay';

    // Actualizar todas las meta tags
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: `${productInfo.title}, monitoreo de precios, alertas de precios, compras inteligentes` });

    // Open Graph Meta Tags
    this.meta.updateTag({ property: 'og:title', content: `AcllaBay - ${productInfo.title}` });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: productInfo.image || 'https://acllabay.com/logo.png' });
    this.meta.updateTag({ property: 'og:url', content: `https://acllabay.com/producto/${this.productId()}` });
    this.meta.updateTag({ property: 'og:type', content: 'product' });

    // Twitter Card Meta Tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: productInfo.title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: productInfo.image || 'https://acllabay.com/logo.png' });

    // Marcar para detección de cambios
    this.cd.markForCheck();
  }

  // Método para actualizar el gráfico con los datos del historial de precios
  updateChart(priceHistory: any) {
    if (isPlatformBrowser(this.platformId)) {
      const documentStyle = getComputedStyle(document.documentElement);

      // Formatear fechas para que sean más legibles
      const formattedDates = priceHistory.dates[0].map((dateString: string) => {
        const date = new Date(dateString);
        return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes()}`;
      });

      this.data = {
        labels: formattedDates,
        datasets: [
          {
            label: 'Historial de precios',
            data: priceHistory.prices[0],
            fill: true,
            borderColor: documentStyle.getPropertyValue('--p-green-500'),
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            tension: 0.1
          }
        ]
      };

      this.cd.markForCheck();
    }
  }

  initChart() {
    if (isPlatformBrowser(this.platformId)) {
      const documentStyle = getComputedStyle(document.documentElement);
      const textColor = documentStyle.getPropertyValue('--p-text-color');
      const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
      const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

      // Inicializar con datos vacíos
      this.data = {
        labels: [],
        datasets: [
          {
            label: 'Historial de precios',
            data: [],
            fill: true,
            borderColor: documentStyle.getPropertyValue('--p-green-500'),
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            tension: 0.4
          }
        ]
      };

      this.options = {
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        plugins: {
          legend: {
            labels: {
              color: textColor
            }
          },
          tooltip: {
            callbacks: {
              label: function (context: any) {
                return `Precio: S/ ${context.raw}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: textColorSecondary
            },
            grid: {
              color: surfaceBorder,
              drawBorder: false
            }
          },
          y: {
            ticks: {
              color: textColorSecondary,
              callback: function (value: any) {
                return 'S/ ' + value;
              }
            },
            grid: {
              color: surfaceBorder,
              drawBorder: false
            }
          }
        }
      };
      this.cd.markForCheck();
    }
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
        this.router.navigate(['/productos']);
      }
    });
  }

    delete(urlId: string): void {
    this.productService.deleteUrl(urlId).subscribe({
      next: (res) => {
        this.router.navigate(['/productos']);
      }
    });
  }
}
