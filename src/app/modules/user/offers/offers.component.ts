import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
    FormsModule
  ],
  providers: [ExtractDomainPipe],
  templateUrl: './offers.component.html',
  styleUrl: './offers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class OffersComponent {
  productService = inject(ProductService);
  extractDomainPipe = inject(ExtractDomainPipe);
  selectedStore: string | null = null;
  availableStores: string[] = [];


  loadStores() {
    const stores = new Set<string>();
    this.productService.productsPublic().forEach(product => {
      const domain = this.extractDomainPipe.transform(product.url); // Usar el pipe
      if (domain) stores.add(domain);
    });
    this.availableStores = Array.from(stores).sort();
  }

  ngOnInit(): void {
    this.productService.getLatestResultsPublic().subscribe(() => {
      this.loadStores();
    });
  }


  // extractDomain(url: string): string {
  //   try {
  //     const domain = new URL(url).hostname.replace('www.', '');
  //     return domain.split('.')[0];
  //   } catch {
  //     return '';
  //   }
  // }


  // get filteredProducts() {
  //   if (!this.selectedStore) {
  //     return this.productService.productsPublic();
  //   }
  //   return this.productService.productsPublic().filter(product => 
  //     this.extractDomain(product.url) === this.selectedStore
  //   );
  // }
  get filteredProducts() {
    if (!this.selectedStore) {
      return this.productService.productsPublic();
    }
    return this.productService.productsPublic().filter(product => 
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
}