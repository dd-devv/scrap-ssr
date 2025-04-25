import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import AuthService from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { InputMask } from 'primeng/inputmask';
import { FloatLabel } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { catchError, map, Observable, of } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputMask,
    FloatLabel,
    PasswordModule,
    ButtonModule,
    Toast
  ],
  providers: [MessageService],
  templateUrl: './forgot-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ForgotPasswordComponent implements OnInit {
  // Inyección de dependencias con inject()
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  loginForm!: FormGroup;
  isLoading = false;

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      whatsapp: ['9', {
        validators: [
          Validators.required,
          this.whatsappValidator
        ],
        asyncValidators: [this.whatsappAsyncValidator()],
        updateOn: 'blur'
      }]
    });
  }

  // Validador sincrónico personalizado para WhatsApp
  whatsappValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    // Eliminar espacios para validación
    const cleaned = value.replace(/\s/g, '');

    // Verificar que sean exactamente 9 dígitos
    if (!/^\d{9}$/.test(cleaned)) {
      return { pattern: true };
    }

    // Verificar que comience con 9
    if (cleaned.charAt(0) !== '9') {
      return { startsWith9: true };
    }

    return null;
  }

  // Validador personalizado para WhatsApp
  private whatsappAsyncValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const phoneNumber = control.value;

      // Si no hay valor, no hay error
      if (!phoneNumber) {
        return of(null);
      }

      // Eliminar espacios para validación
      const cleaned = phoneNumber.replace(/\s/g, '');


      // Verificación de WhatsApp
      return this.authService.verificar_whatsapp(cleaned).pipe(
        map(response => {
          return response.data ? null : { noWhatsapp: true };
        }),
        catchError((error) => {
          return of({ whatsappVerificationError: true });
        })
      );
    };
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const whatsappValue = this.loginForm.get('whatsapp')?.value;

    // Eliminar espacios del número de WhatsApp
    const whatsapp = whatsappValue?.replace(/\s/g, '');

    this.authService.forgotPassword(whatsapp)
      .subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Código enviado correctamente', life: 3000 });
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error.error || error.error.message, life: 3000 });

          this.isLoading = false;
        }
      });
  }

  // Método para verificar si un campo ha sido tocado o modificado
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  // Método para obtener mensajes de error específicos según el tipo de error
  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);

    if (!field || !field.errors) return '';

    const errors = field.errors;

    // Mensajes de error para WhatsApp
    if (fieldName === 'whatsapp') {
      if (errors['required']) return 'El número de WhatsApp es requerido';
      if (errors['pattern']) return 'El número de WhatsApp debe tener 9 dígitos';
      if (errors['startsWith9']) return 'El número de WhatsApp debe comenzar con 9';
    }

    return 'Campo inválido';
  }

  // Getters para acceso rápido a los controles del formulario
  get whatsapp() { return this.loginForm.get('whatsapp'); }
}
