import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';

@Injectable()
@Pipe({
  name: 'extractDomain',
  pure: true
})
export class ExtractDomainPipe implements PipeTransform {
  private readonly supportedDomains = [
    'sodimac',
    'tottus',
    'linio',
    'falabella',
    'ripley',
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

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  transform(url: string): string | null {
    if (!url) return null;

    // Lógica para entornos de servidor y cliente
    if (isPlatformBrowser(this.platformId)) {
      try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname.toLowerCase();

        const matchedDomain = this.supportedDomains.find(domain =>
          hostname.includes(domain)
        );

        return matchedDomain || null;
      } catch (error) {
        return null;
      }
    } else {
      // Lógica para server-side rendering
      const matchedDomain = this.supportedDomains.find(domain =>
        url.toLowerCase().includes(domain)
      );

      return matchedDomain || null;
    }
  }
}
