import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import  ProductService  from '../../user/services/product.service';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-floating-add-product-button',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    Ripple,
    DialogModule,
    InputTextModule,
    TooltipModule,
    FormsModule,
    TextareaModule,
    FloatLabelModule,
    ToastModule
  ],
  templateUrl: './floating-add-product-button.component.html',
  styleUrls: ['./floating-add-product-button.component.css'],
  providers: [MessageService] // Añade MessageService como proveedor
})
export class FloatingAddProductButtonComponent {
  productService = inject(ProductService);
  messageService = inject(MessageService);
  
  visible = signal(false);
  loading = signal(false);
  disabled = signal(false);
  url: string = '';
  
  // Nuevas propiedades para controlar los mensajes
  private hasUrl = signal(false);
  private isSupported = signal(false);

  @Output() productAdded = new EventEmitter<void>();

  onPaste(event: ClipboardEvent) {
    setTimeout(() => {
      this.evaluateUrl();
    }, 10);
  }

  evaluateUrl() {
    const supportedDomains = [
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
      'metro',
    ];

    const urlTrimmed = this.url.trim();
    this.hasUrl.set(urlTrimmed.length > 0);

    if (urlTrimmed.length === 0) {
      this.disabled.set(false);
      this.isSupported.set(false);
      return;
    }

    // Verificar si es una URL válida
    const isValidUrl = this.isValidHttpUrl(urlTrimmed);
    
    if (!isValidUrl) {
      this.disabled.set(true);
      this.isSupported.set(false);
      return;
    }

    const isDomainSupported = supportedDomains.some(domain =>
      urlTrimmed.toLowerCase().includes(domain)
    );

    this.disabled.set(!isDomainSupported);
    this.isSupported.set(isDomainSupported);
  }

  // Método para validar si es una URL válida
  private isValidHttpUrl(string: string): boolean {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // Métodos para mostrar los mensajes
  showUnsupportedMessage(): boolean {
    return this.hasUrl() && !this.isSupported() && this.isValidHttpUrl(this.url.trim());
  }

  showSupportedMessage(): boolean {
    return this.hasUrl() && this.isSupported();
  }

  registrarUrl() {
    this.loading.set(true);
    this.productService.registerUrl([this.url], '10min').subscribe({
      next: (res) => {
        this.loading.set(false);
        this.url = '';
        this.hasUrl.set(false);
        this.isSupported.set(false);
        this.closeDialog();
        this.productAdded.emit();
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Éxito', 
          detail: 'Registrado correctamente', 
          life: 3000 
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error!', 
          detail: 'Error al registrar', 
          life: 3000 
        });
      }
    });
  }

  showDialog() {
    this.visible.set(true);
  }

  closeDialog() {
    this.visible.set(false);
    // Limpiar el estado cuando se cierra el diálogo
    this.url = '';
    this.hasUrl.set(false);
    this.isSupported.set(false);
    this.disabled.set(false);
  }
}