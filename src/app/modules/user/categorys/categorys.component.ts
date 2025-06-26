import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Chip } from 'primeng/chip';
import { Toast } from 'primeng/toast';
import AuthService from '../../auth/services/auth.service';
import { CategoryService } from '../services/category.service';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-categorys',
  imports: [
    Toast,
    MessageModule,
    Chip
  ],
  templateUrl: './categorys.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService]
})
export default class CategorysComponent implements OnInit {
  messageService = inject(MessageService);
  authService = inject(AuthService);
  categoryService = inject(CategoryService);
  categorys = this.categoryService.categorysAll;
  categorysUser = this.categoryService.categorysUser;
  loading = this.categoryService.isLoading;

  ngOnInit() {
    this.getCategorys();
    this.getCategorysUser();
  }

  getCategorys() {
    this.categoryService.getCategorysAll().subscribe();
  }

  getCategorysUser() {
    this.categoryService.getUserCategorys().subscribe({
      next: () => {
        this.categorysUser.set(this.categoryService.categorysUser());
      }
    });
  }

  // Método para manejar el click en las categorías
  toggleCategory(category: string) {
    const index = this.categorysUser().indexOf(category);

    if (index > -1) {
      // Si ya está seleccionada, la removemos
      this.categorysUser().splice(index, 1);
      this.deleteCategorysUser(category);
    } else {
      // Si no está seleccionada, la agregamos
      this.categorysUser().push(category);
      this.registerCategorysUser(category);
    }
  }

  // Método para verificar si una categoría está seleccionada
  isCategorySelected(category: string): boolean {
    return this.categorysUser().includes(category);
  }

  registerCategorysUser(category: string) {
    if (category.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debes seleccionar al menos una categoría'
      });
      return;
    }

    // Mandar al backend a registrar las categorias del usuario
    this.categoryService.registerUserCategorys([category]).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Registrado correctamente'
        });
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

  deleteCategorysUser(category: string) {
    if (category.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debes seleccionar al menos una categoría'
      });
      return;
    }

    // Mandar al backend a eliminar las categorias del usuario
    this.categoryService.deleteUserCategory(category).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Eliminado correctamente'
        });
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
