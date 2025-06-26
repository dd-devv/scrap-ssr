import { ChangeDetectionStrategy, Component, inject, Inject, PLATFORM_ID, OnInit, effect, computed, signal } from '@angular/core';
import { isPlatformBrowser, SlicePipe } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { HeaderComponent } from "../common/header/header.component";
import { FooterComponent } from "../common/footer/footer.component";
import { RouterOutlet } from '@angular/router';
import { SubscriptionService } from '../../user/services/subscription.service';
import AuthService from '../../auth/services/auth.service';
import { FeedbackComponent } from "../../shared/feedback/feedback.component";
import { FloatingAddProductButtonComponent } from '../../shared/floating-add-product-button/floating-add-product-button.component';
import { CategoryService } from '../../user/services/category.service';
import { Dialog } from 'primeng/dialog';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Chip } from 'primeng/chip';

@Component({
  selector: 'app-layout',
  imports: [
    HeaderComponent,
    FooterComponent,
    RouterOutlet,
    // FeedbackComponent,
    FloatingAddProductButtonComponent,
    Dialog,
    Toast,
    Button,
    Chip,
    SlicePipe
  ],
  templateUrl: './layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService]
})
export class LayoutComponent implements OnInit {
  subscriptionService = inject(SubscriptionService);
  messageService = inject(MessageService);
  authService = inject(AuthService);
  categoryService = inject(CategoryService);
  private cdr = inject(ChangeDetectorRef);
  categorys = this.categoryService.categorysAll;
  loading = this.categoryService.isLoading;

  categorysSelected: string[] = [];

  isBrowser = false;

  dialogVisible = signal(false);

  shouldShowDialog = computed(() =>
    this.isBrowser && !this.categoryService.hasUserCats()
  );

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Effect para sincronizar el computed con el signal local
    effect(() => {
      const shouldShow = this.shouldShowDialog();
      this.dialogVisible.set(shouldShow);
      this.cdr.markForCheck();
    });
  }

  ngOnInit() {
    // Verificar si estamos en el navegador
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.categoryService.hasUserCategorys().subscribe();
    }

    if (this.authService.isAuthenticated()) {
      this.subscriptionService.getSubscriptionStatus().subscribe();
    }

    this.getCategorys();
  }

  getCategorys() {
    this.categoryService.getCategorysAll().subscribe();
  }

  closeDialog() {
    this.categoryService.hasUserCats.set(true);
  }

  // Método para manejar el click en las categorías
  toggleCategory(category: string) {
    const index = this.categorysSelected.indexOf(category);

    if (index > -1) {
      // Si ya está seleccionada, la removemos
      this.categorysSelected.splice(index, 1);
    } else {
      // Si no está seleccionada, la agregamos
      this.categorysSelected.push(category);
    }

    this.cdr.markForCheck();
  }

  // Método para verificar si una categoría está seleccionada
  isCategorySelected(category: string): boolean {
    return this.categorysSelected.includes(category);
  }

  registerCategorysUser() {
    if (this.categorysSelected.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debes seleccionar al menos una categoría'
      });
      return;
    }

    // Mandar al backend a registrar las categorias del usuario
    this.categoryService.registerUserCategorys(this.categorysSelected).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Registrado correctamente'
        });
        this.closeDialog();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al registrar las categorías'
        });
      }
    });
  }
}
