import { Component, inject, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { AvatarModule } from 'primeng/avatar';
import { CarouselModule } from 'primeng/carousel';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicService } from '../../services/public.service';
import { NumberShortPipe } from '../../../../pipes/number-Short.pipe';
import ProductService from '../../../user/services/product.service';
import { ExtractDomainPipe } from '../../../../pipes/extract-domain.pipe';
import { ThemeService } from '../../../../services/theme.service';
import AuthService from '../../../auth/services/auth.service';
import { Shop, Shops } from '../../../../interfaces/shop.interface';
import { Meta, Title } from '@angular/platform-browser';

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
  private meta = inject(Meta);
  private title = inject(Title);

  shops: Shop[] = Shops;

  ngOnInit(): void {
    // this.productService.getProductsSmall().then((products) => {
    //   this.products = products;
    // });

    this.publicService.getUsersLenght().subscribe();
    this.productService.getLatestResultsPublic().subscribe();

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
    this.title.setTitle('AcllaBay - Tu compañero inteligente de compras');

    // Meta tags para SEO básicos
    this.meta.addTags([
      { name: 'description', content: 'AcllaBay - Monitorea tus productos favoritos online y recibe alertas de WhatsApp cuando los precios bajen. Ahorra tiempo y dinero en tus compras online.' },
      { name: 'keywords', content: 'monitoreo de precios, alertas de precios, ahorro en compras, seguimiento de productos, WhatsApp alertas, compras inteligentes, comparador de precios' },
      { name: 'author', content: 'AcllaBay' },

      // Open Graph Meta Tags para compartir en redes sociales
      { property: 'og:title', content: 'AcllaBay - Tu compañero inteligente de compras' },
      { property: 'og:description', content: 'Recibe alertas instantáneas cuando los precios de tus productos favoritos bajen. Compra al mejor precio sin perder tiempo.' },
      { property: 'og:image', content: 'https://acllabay.com/logo.png' },
      { property: 'og:url', content: 'https://acllabay.com/' },
      { property: 'og:type', content: 'website' },

      // Twitter Card Meta Tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'AcllaBay - Ahorra sin perder tiempo' },
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

  goApp() {
    console.log('Go App');
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
}
