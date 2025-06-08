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
import { TimeAgoPipe } from './../../../pipes/timeAgo.pipe';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import AuthService from '../../auth/services/auth.service';


@Component({
  selector: 'app-offer',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    Button,
    ChartModule,
    Skeleton,
    ExtractDomainPipe,
    TimeAgoPipe,
    ConfirmDialog
  ],
  providers: [ConfirmationService],
  styleUrl: './offer.component.css',
  templateUrl: './offer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class OfferComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private confirmationService = inject(ConfirmationService);
  productService = inject(ProductService);
  authService = inject(AuthService);
  router = inject(Router);
  private meta = inject(Meta); // Inyectamos el servicio Meta
  private title = inject(Title); // Inyectamos el servicio Title

  // Signal para almacenar el id
  productId = signal<string | null>(null);
  data: any;
  options: any;
  platformId = inject(PLATFORM_ID);
  urlId: string = '';

  estadosOfertas = signal<{ [key: string]: boolean }>({});

  constructor(private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      tap(params => {
        const id = params.get('urlId');
        this.productId.set(id);
        this.cargarEstadoJobs(id!);
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
      const formattedDates = priceHistory.dates.map((dateString: string) => {
        const date = new Date(dateString);
        return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes()}`;
      });

      this.data = {
        labels: formattedDates,
        datasets: [
          {
            label: 'Historial de precios',
            data: priceHistory.prices,
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
  // Método para encontrar el primer elemento de un arreglo
  findFirst(arr: any[]): any {
    console.log("arr findFirst",arr[0])
    return arr.length > 0 ? arr[0] : null;
  }
  findLast(arr: any[]): any {
    return arr.length > 0 ? arr[0][arr[0].length - 1] : null;
  }


  findMin(arr: number[]): string | number {
    return arr.reduce((min, current) => (current < min ? current : min), arr[0]);
  }
  // Método para encontrar el menor numero de un arreglo
  findMax(arr: number[]): number {
    return arr.reduce((max, current) => (current > max ? current : max), arr[0]);
  }

  calcularMediana(precios: number[]): number {
    const ordenados = [...precios].sort((a, b) => a - b);
    const mitad = Math.floor(ordenados.length / 2);

    if (ordenados.length === 0) return 0;

    return ordenados.length % 2 === 0
      ? (ordenados[mitad - 1] + ordenados[mitad]) / 2
      : ordenados[mitad];
  }

  obtenerEstadoDelPrecio(
    precioActual: number,
    preciosHistoricos: number[]
  ): String {
    if (preciosHistoricos.length === 0) return 'rojo';

    const mediana = this.calcularMediana(preciosHistoricos);
    const minimo = Math.min(...preciosHistoricos);

    // if (precioActual <= minimo && precioActual != mediana) {
    if (precioActual <= minimo) {
      return 'verde'; // 🟢 Precio mínimo histórico
    } else if (precioActual <= mediana * 1.05) {
      return 'amarillo'; // 🟡 Precio cercano al habitual
    } else {
      return 'rojo'; // 🔴 Precio alto
    }
  }
  calcularDescuento(precioPromedio: number, precioActual: number): string {
    if (precioPromedio <= precioActual) return 'Sin descuento';
    const descuento = ((precioPromedio - precioActual) / precioPromedio) * 100;
    return `${descuento.toFixed(2)}%`;
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

  confirm(url: string, urlId: string) {
    this.urlId = urlId;
    this.confirmationService.confirm({
      header: `¿Seguro que quieres dejar de seguir este producto?`,
      message: 'Perderás las alertas de bajada de precio 😢',
      accept: () => {
        // Abrir URL en una nueva pestaña de manera segura y compatible con SSR
        this.deleteUrl();
      },
      reject: () => {
      },
    });
  }

  deleteUrl(): void {
    this.productService.deleteUrl(this.urlId).subscribe({
      next: (res) => {
        this.router.navigate(['/ofertas']);
      }
    });
  }
}
