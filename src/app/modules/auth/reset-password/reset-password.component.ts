import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { tap } from 'rxjs';
import AuthService from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { InputMask } from 'primeng/inputmask';
import { FloatLabel } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-reset-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    FloatLabel,
    PasswordModule,
    ButtonModule,
    RouterLink,
    Toast
  ],
  providers: [MessageService],
  templateUrl: './reset-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  resetToken = signal<string | null>(null);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  resetForm!: FormGroup;
  isLoading = false;

  ngOnInit(): void {
    this.route.paramMap.pipe(
      tap(params => {
        const token = params.get('token');
        this.resetToken.set(token);
      })
    ).subscribe();

    this.initForm();

    console.log(this.resetToken());
  }

  initForm(): void {
    this.resetForm = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]]
    });
  }

  // Método para verificar si un campo ha sido tocado o modificado
  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  // Método para obtener mensajes de error específicos según el tipo de error
  getErrorMessage(fieldName: string): string {
    const field = this.resetForm.get(fieldName);

    if (!field || !field.errors) return '';

    const errors = field.errors;

    // Mensajes de error para Password
    if (fieldName === 'password') {
      if (errors['required']) return 'La contraseña es requerida';
      if (errors['minlength']) {
        const requiredLength = errors['minlength'].requiredLength;
        return `La contraseña debe tener al menos ${requiredLength} caracteres`;
      }
    }

    return 'Campo inválido';
  }

  resetPassword(): void {
    this.authService.resetPassword(this.resetToken()!, this.resetForm.value.password).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Contraseña restablecida exitosamente', life: 3000 });
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
        this.isLoading = false;
      },
      error: (err)=> {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error restableciendo la contraseña.', life: 3000 });
        setTimeout(() => {
          this.router.navigate(['/forgot-password']);
        }, 2000);
        this.isLoading = false;
      }
    });
  }
}
