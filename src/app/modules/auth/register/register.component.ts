import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import AuthService from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { FloatLabel } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    FloatLabel,
    PasswordModule,
    ButtonModule,
    RouterLink,
    Toast
  ],
  providers: [MessageService],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  registerForm!: FormGroup;
  isLoading = false;

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.registerForm = this.fb.group({
      fullname: ['name', [
        Validators.required,
        Validators.minLength(4)
      ]],
      // email: ['', [
      //   Validators.required,
      //   Validators.email,
      //   Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      // ]],
      whatsapp: ['', {
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

  // Validador asíncrono para verificar existencia del WhatsApp
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
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const fullnameValue = this.registerForm.get('fullname')?.value;
    // const emailValue = this.registerForm.get('email')?.value;
    const whatsappValue = this.registerForm.get('whatsapp')?.value;

    // Eliminar espacios del número de WhatsApp
    const whatsapp = whatsappValue?.replace(/\s/g, '');

    this.authService.register(fullnameValue, whatsapp)
      .subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.message, life: 3000 });
          this.isLoading = false;
          setTimeout(() => {
            this.router.navigate(['/verify-whatsapp']);
          }, 2000);
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error.error, life: 3000 });
          this.isLoading = false;
        }
      });
  }

  // Método para verificar si un campo ha sido tocado o modificado
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

    onlyNumbers(event: KeyboardEvent): boolean {
  const charCode = (event.which) ? event.which : event.keyCode;
  // Solo permitir teclas numéricas (0-9) y algunas teclas de control
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    event.preventDefault();
    return false;
  }
  return true;
}

// Método para formatear y limitar el número
formatWhatsapp(event: Event): void {
  const input = event.target as HTMLInputElement;
  let value = input.value.replace(/\D/g, ''); // Eliminar todo lo que no sea dígito
  
  // Limitar a 9 dígitos
  if (value.length > 9) {
    value = value.substring(0, 9);
  }
  
  // Actualizar el valor en el formulario
  this.registerForm.get('whatsapp')?.setValue(value, { emitEvent: true });
  
  // Forzar la actualización del valor en el input
  input.value = value;
}

  // Método para obtener mensajes de error específicos según el tipo de error
  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);

    if (!field || !field.errors) return '';

    const errors = field.errors;

    // Mensajes de error para email
    // if (fieldName === 'email') {
    //   if (errors['required']) return 'El correo electrónico es requerido';
    //   if (errors['email'] || errors['pattern']) return 'Ingrese un correo electrónico válido';
    // }

    // Mensajes de error para WhatsApp
    if (fieldName === 'whatsapp') {
      if (errors['required']) return 'El número de WhatsApp es requerido';
      if (errors['pattern']) return 'El número de WhatsApp debe tener 9 dígitos';
      if (errors['startsWith9']) return 'El número de WhatsApp debe comenzar con 9';
      if (errors['noWhatsapp']) return 'Este número no tiene WhatsApp';
      if (errors['whatsappVerificationError']) return 'Error al verificar el número de WhatsApp';
    }

    // Mensajes de error para el nombre completo
    if (fieldName === 'fullname') {
      if (errors['required']) return 'El nombre completo es requerido';
      if (errors['minlength']) {
        const requiredLength = errors['minlength'].requiredLength;
        return `El nombre completo debe tener al menos ${requiredLength} caracteres`;
      }
    }

    return 'Campo inválido';
  }

  // Getters para acceso rápido a los controles del formulario
  get fullname() { return this.registerForm.get('fullname'); }
  // get email() { return this.registerForm.get('email'); }
  get whatsapp() { return this.registerForm.get('whatsapp'); }
}
