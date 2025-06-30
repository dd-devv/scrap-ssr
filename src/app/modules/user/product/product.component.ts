import { TimeAgoPipe } from './../../../pipes/timeAgo.pipe';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, CurrencyPipe, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { switchMap, tap } from 'rxjs/operators';
import ProductService from '../services/product.service';
import { Button } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Skeleton } from 'primeng/skeleton';
import { ExtractDomainPipe } from '../../../pipes/extract-domain.pipe';
import { Meta, Title } from '@angular/platform-browser'; // Importar Meta y Title
import AuthService from '../../auth/services/auth.service';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    Button,
    ChartModule,
    ConfirmDialog,
    Skeleton,
    ExtractDomainPipe,
    TimeAgoPipe,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  styleUrl: './product.component.css',
  templateUrl: './product.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProductComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private confirmationService = inject(ConfirmationService);
  productService = inject(ProductService);
  private messageService = inject(MessageService);
  authService = inject(AuthService);
  router = inject(Router);
  private meta = inject(Meta); // Inyectar servicio Meta
  private title = inject(Title); // Inyectar servicio Title
  private document = inject(DOCUMENT);

  // Signal para almacenar el id
  productId = signal<string | null>(null);
  data: any;
  options: any;
  platformId = inject(PLATFORM_ID);
  urlId: string = '';

  isLoading = this.productService.isLoading;
  isLoadingEqual = this.productService.isLoadingEqual;
  isLoadingRec = this.productService.isLoadingRec;

  productsEqual = this.productService.productsEqual;
  productsRec = this.productService.productsRecommended;

  estadosOfertas = signal<{ [key: string]: boolean }>({});

  constructor(private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      tap(params => {
        const id = params.get('id');
        this.productId.set(id);

        // Añadir canonical URL temprano
        this.updateCanonicalUrl(id!);
        this.cargarEstadoJobs(id!);
      }),
      switchMap(() => {
        const id = this.productId() ?? '';
        this.loadProductsEqual(id);
        this.loadProductsRecommended(id);
        return this.productService.getPriceHistory(id);
      }),
      tap(response => {
        if (response && response.priceHistory) {
          this.updateChart(response.priceHistory);

          if (response.productInfo) {
            this.updateMetaTags(response.productInfo);
            // Añadir structured data
            this.addStructuredData(response.productInfo);
          }
        }
      })
    ).subscribe();

    this.initChart();
  }

  loadProductsEqual(id: string) {
    this.productService.getProductsEqual(id).subscribe({
      next: () => {
        console.log(this.productsEqual());
      },
      error: (err) => {
        console.error('Error loading products:', err);
      }
    });
  }

  loadProductsRecommended(id: string) {
    this.productService.getProductsRecommended(id).subscribe({
      next: () => {
        console.log(this.productsRec());
      },
      error: (err) => {
        console.error('Error loading products:', err);
      }
    });
  }

  private updateMetaTags(productInfo: any): void {
    if (!productInfo) return;

    const cleanTitle = `${productInfo.title} - Monitoreo de Precios | AcllaBay`;
    const description = productInfo.description ?
      `Monitorea el precio de ${productInfo.title}. ${productInfo.description.slice(0, 120)}...` :
      `Monitoreo de precios y alertas de WhatsApp para ${productInfo.title} en AcllaBay`;

    // Meta tags básicas
    this.title.setTitle(cleanTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: `${productInfo.title}, monitoreo precios, alertas WhatsApp, seguimiento precios` });

    // Robots específicos para esta página
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large' });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: cleanTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: productInfo.image || 'https://acllabay.com/assets/og-default.png' });
    this.meta.updateTag({ property: 'og:url', content: `https://acllabay.com/seguimientos/${this.productId()}` });
    this.meta.updateTag({ property: 'og:type', content: 'product' });
    this.meta.updateTag({ property: 'og:site_name', content: 'AcllaBay' });

    // Twitter Cards
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:site', content: '@acllabay' }); // si tienes Twitter
    this.meta.updateTag({ name: 'twitter:title', content: cleanTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: productInfo.image || 'https://acllabay.com/assets/twitter-default.png' });

    this.cd.markForCheck();
  }

  // Método adicional para canonical URL
  private updateCanonicalUrl(productId: string): void {
    const canonicalUrl = `https://acllabay.com/seguimientos/${productId}`;

    // Remover canonical existente si existe
    const existingCanonical = this.document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Añadir nuevo canonical
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', canonicalUrl);
    this.document.head.appendChild(link);
  }

  // Structured Data para mejor SEO
  private addStructuredData(productInfo: any): void {
    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": productInfo.title,
      "description": productInfo.description,
      "image": productInfo.image,
      "url": `https://acllabay.com/seguimientos/${this.productId()}`,
      "brand": {
        "@type": "Brand",
        "name": productInfo.brand || "AcllaBay"
      },
      "offers": {
        "@type": "Offer",
        "price": productInfo.currentPrice,
        "priceCurrency": "PEN", // o la moneda que uses
        "availability": "https://schema.org/InStock",
        "url": `https://acllabay.com/seguimientos/${this.productId()}`
      }
    };

    // Remover script anterior si existe
    const existingScript = this.document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Añadir nuevo structured data
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    this.document.head.appendChild(script);
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

  fecha(fecha: string | Date): string {
    const date = new Date(fecha); // Convierte string o Date a un Date válido
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Método para encontrar el primer elemento de un arreglo
  findFirst(arr: any[]): any {
    return arr.length > 0 ? arr[0] : null;
  }

  findLast(arr: any[]): any {
    return arr.length > 0 ? arr.at(-1) : null;
  }
  calcularMediana(precios: number[]): number {
    const ordenados = [...precios].sort((a, b) => a - b);
    const mitad = Math.floor(ordenados.length / 2);

    if (ordenados.length === 0) return 0;

    return ordenados.length % 2 === 0
      ? (ordenados[mitad - 1] + ordenados[mitad]) / 2
      : ordenados[mitad];
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

      const duracion = (fechaFin.getTime() - fechaInicio.getTime()) / 1000; // duración en segundos

      sumaPesoPrecio += precios[i] * duracion;
      sumaDuracion += duracion;
    }

    return sumaDuracion === 0 ? 0 : sumaPesoPrecio / sumaDuracion;
  }

  //metodo para con el precio promedio y el precio actual, calcular el porcentaje de descuento
  calcularDescuento(precioPromedio: number, precioActual: number): string {
    if (precioPromedio <= precioActual) return 'Sin descuento';
    const descuento = ((precioPromedio - precioActual) / precioPromedio) * 100;
    return `${descuento.toFixed(2)}%`;
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


  findMin(arr: number[]): string | number {
    return arr.reduce((min, current) => (current < min ? current : min), arr[0]);
  }
  // Método para encontrar el menor numero de un arreglo
  findMax(arr: number[]): number {
    return arr.reduce((max, current) => (current > max ? current : max), arr[0]);
  }

  deleteUrl(): void {
    this.productService.deleteUrl(this.urlId).subscribe({
      next: (res) => {
        this.router.navigate(['/seguimientos']);
      }
    });
  }

  delete(urlId: string): void {
    this.productService.deleteUrl(urlId).subscribe({
      next: (res) => {
        this.router.navigate(['/seguimientos']);
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

  addUrlForMe(sourceJobId: string, urlId: string) {
    this.isLoading.set(true);
    this.productService.addUrlForMe(sourceJobId, urlId).subscribe({
      next: (response) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Agregado a tu seguimiento', life: 3000 });
        this.cargarEstadoJobs(this.productId()!);
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
}
