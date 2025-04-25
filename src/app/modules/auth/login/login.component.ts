import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { InputMask } from 'primeng/inputmask';
import { FloatLabel } from "primeng/floatlabel";
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import AuthService from '../services/auth.service';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputMask,
    FloatLabel,
    PasswordModule,
    ButtonModule,
    RouterLink,
    Toast
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
})
export default class LoginComponent implements OnInit {
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
      whatsapp: ['9', [
        Validators.required,
        this.whatsappValidator
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]]
    });
  }

  // Validador personalizado para WhatsApp
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

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const whatsappValue = this.loginForm.get('whatsapp')?.value;
    const passwordValue = this.loginForm.get('password')?.value;

    // Eliminar espacios del número de WhatsApp
    const whatsapp = whatsappValue?.replace(/\s/g, '');

    this.authService.login(whatsapp, passwordValue)
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error.error || error.error.message, life: 3000 });

          this.isLoading = false;

          if (error.error.tempToken) {
            setTimeout(() => {
              this.router.navigate(['/verify-whatsapp']);
            }, 2000);
          }

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

  // Getters para acceso rápido a los controles del formulario
  get whatsapp() { return this.loginForm.get('whatsapp'); }
  get password() { return this.loginForm.get('password'); }
}
