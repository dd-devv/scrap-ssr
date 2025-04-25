import { CommonModule, CurrencyPipe, isPlatformBrowser, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { Card } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { Skeleton } from 'primeng/skeleton';
import { ExtractDomainPipe } from '../../../pipes/extract-domain.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import ProductService from '../services/product.service';
import { switchMap, tap } from 'rxjs';
import { Message } from 'primeng/message';
import { Meta, Title } from '@angular/platform-browser'; // Importamos Meta y Title

@Component({
  selector: 'app-offer',
  imports: [
    CommonModule,
    Card,
    SlicePipe,
    CurrencyPipe,
    ChartModule,
    Skeleton,
    ExtractDomainPipe,
    Message
  ],
  providers: [],
  templateUrl: './offer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class OfferComponent implements OnInit {
  private route = inject(ActivatedRoute);
  productService = inject(ProductService);
  router = inject(Router);
  private meta = inject(Meta); // Inyectamos el servicio Meta
  private title = inject(Title); // Inyectamos el servicio Title

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
        const id = params.get('urlId');
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

          // Actualizar meta tags con la información del producto cuando esté disponible
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
    this.title.setTitle(`Oferta: ${productInfo.title} - AcllaBay`);

    // Obtener una descripción limpia
    const description = productInfo.description ?
        `${productInfo.description.slice(0, 150)}...` :
        `Oferta especial: ${productInfo.title} a S/ ${productInfo.currentPrice} - Aprovecha esta oferta en AcllaBay`;

    // Generar la URL actual según la estructura de tu aplicación
    const currentUrl = `https://acllabay.com/oferta/${this.productId()}`;

    // Actualizar todas las meta tags
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: `${productInfo.title}, oferta, descuento, monitoreo de precios, compras inteligentes` });

    // Open Graph Meta Tags
    this.meta.updateTag({ property: 'og:title', content: `Oferta: ${productInfo.title} - AcllaBay` });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: productInfo.image || 'https://acllabay.com/logo.png' });
    this.meta.updateTag({ property: 'og:url', content: currentUrl });
    this.meta.updateTag({ property: 'og:type', content: 'product' });

    // Twitter Card Meta Tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: `Oferta: ${productInfo.title}` });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: productInfo.image || 'https://acllabay.com/logo.png' });

    // Meta tag adicional específico para ofertas
    this.meta.updateTag({ name: 'product:price:amount', content: `${productInfo.currentPrice}` });
    this.meta.updateTag({ name: 'product:price:currency', content: 'PEN' });

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
}
