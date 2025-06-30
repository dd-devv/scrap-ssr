import { ChangeDetectorRef, Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { AvatarModule } from 'primeng/avatar';
import { CarouselModule } from 'primeng/carousel';
import { TagModule } from 'primeng/tag';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicService } from '../../services/public.service';
import { NumberShortPipe } from '../../../../pipes/number-Short.pipe';
import ProductService from '../../../user/services/product.service';
import { ExtractDomainPipe } from '../../../../pipes/extract-domain.pipe';
import { ThemeService } from '../../../../services/theme.service';
import AuthService from '../../../auth/services/auth.service';
import { Shop, Shops } from '../../../../interfaces/shop.interface';
import { Meta, Title } from '@angular/platform-browser';
import { PriceHistory } from '../../../user/interfaces';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    AnimateOnScrollModule,
    AvatarModule,
    CarouselModule,
    TagModule,
    RouterLink,
    NumberShortPipe,
    ExtractDomainPipe,
    ChartModule
  ],
  providers: [MessageService],
  templateUrl: './home.component.html',
  styles: ` `,
})
export default class HomeComponent implements OnInit {
  responsiveOptions: any[] | undefined;
  messageService = inject(MessageService);
  publicService = inject(PublicService);
  productService = inject(ProductService);
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  cd = inject(ChangeDetectorRef);
  private meta = inject(Meta);
  private title = inject(Title);
  platformId = inject(PLATFORM_ID);
  document = inject(DOCUMENT);

  products = this.productService.productsPublic;
  loading = true;
  productRandom = signal<PriceHistory>({} as PriceHistory);
  data: any;
  options: any;

  shops: Shop[] = Shops;

  ngOnInit(): void {
    // this.productService.getProductsSmall().then((products) => {
    //   this.products = products;
    // });

    this.initChart();
    this.publicService.getUsersLenght().subscribe();
    if (isPlatformBrowser(this.platformId)) {
      this.productService.getLatestResultsPublic().subscribe({
        next: (res) => {
          const indexRandom = Math.floor(Math.random() * 20);
          const prodRandom = res[indexRandom];

          this.productService.getPriceHistory(prodRandom.urlId).subscribe({
            next: (response) => {
              this.productRandom.set(response);
              this.updateChart(this.productRandom().priceHistory);
              this.loading = false;
            }
          });
        }
      });
    }

    // Configurar meta tags para SEO
    this.setMetaTags();

    this.responsiveOptions = [
      {
        breakpoint: '1400px',
        numVisible: 2,
        numScroll: 1,
      },
      {
        breakpoint: '1199px',
        numVisible: 3,
        numScroll: 1,
      },
      {
        breakpoint: '767px',
        numVisible: 2,
        numScroll: 1,
      },
      {
        breakpoint: '575px',
        numVisible: 1,
        numScroll: 1,
      },
    ];
  }

  private setMetaTags(): void {
    // Establecer título de la página
    this.title.setTitle('Acllabay - Tu compañero inteligente de compras');

    // Meta tags para SEO básicos
    this.meta.addTags([
      { name: 'description', content: 'Acllabay - Monitorea tus productos favoritos online y recibe alertas de WhatsApp cuando los precios bajen. Ahorra tiempo y dinero en tus compras online.' },
      { name: 'keywords', content: 'monitoreo de precios, alertas de precios, ahorro en compras, seguimiento de productos, WhatsApp alertas, compras inteligentes, comparador de precios' },
      { name: 'author', content: 'Acllabay' },

      // Open Graph Meta Tags para compartir en redes sociales
      { property: 'og:title', content: 'Acllabay - Tu compañero inteligente de compras' },
      { property: 'og:description', content: 'Recibe alertas instantáneas cuando los precios de tus productos favoritos bajen. Compra al mejor precio sin perder tiempo.' },
      { property: 'og:image', content: 'https://acllabay.com/logo.png' },
      { property: 'og:url', content: 'https://acllabay.com/' },
      { property: 'og:type', content: 'website' },

      // Twitter Card Meta Tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Acllabay - Ahorra sin perder tiempo' },
      { name: 'twitter:description', content: 'Monitorea precios online y recibe alertas instantáneas de WhatsApp cuando bajen.' },
      { name: 'twitter:image', content: 'https://acllabay.com/logo.png' }
    ]);
  }

  show() {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Message Content',
      life: 3000,
    });
  }

  truncateText(text: string, length: number = 40): string {
    if (text.length <= length) {
      return text;
    }
    return text.substring(0, length) + '...';
  }

  getSeverity(status: string): 'success' | 'warn' | 'danger' | undefined {
    switch (status) {
      case 'activo':
        return 'success';
      case 'pendiente':
        return 'warn';
      case 'inactivo':
        return 'danger';
      default:
        return undefined;
    }
  }

  initChart() {
    if (isPlatformBrowser(this.platformId) && this.document) {
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
        aspectRatio: 0.8,
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
}
