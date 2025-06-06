import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { FloatLabel } from "primeng/floatlabel";
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import AuthService from '../services/auth.service';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { InputOtpModule } from 'primeng/inputotp';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    FloatLabel,
    PasswordModule,
    ButtonModule,
    RouterLink,
    Toast,
    InputTextModule,
    InputOtpModule
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
})
export default class LoginComponent implements OnInit, OnDestroy {
  // Inyección de dependencias con inject()
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  loginForm!: FormGroup;
  isLoading = false;
  codeSended = signal(false);

  // Variables para el contador
  countdown = signal(0);
  canResendCode = signal(true);
  private countdownInterval: any = 30;

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    // Limpiar el intervalo cuando se destruye el componente
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      whatsapp: ['', [
        Validators.required,
        this.whatsappValidator
      ]],
      code: ['', [
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
    const codeValue = this.loginForm.get('code')?.value;

    // Eliminar espacios del número de WhatsApp
    const whatsapp = whatsappValue?.replace(/\s/g, '');

    this.authService.login(whatsapp, codeValue)
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

    // Mensajes de error para code
    if (fieldName === 'code') {
      if (errors['required']) return 'El código es requerido';
      if (errors['minlength']) {
        const requiredLength = errors['minlength'].requiredLength;
        return `El código debe tener al menos ${requiredLength} caracteres`;
      }
    }

    return 'Campo inválido';
  }

  requestLoginCode() {
    // Verificar si se puede reenviar el código
    if (!this.canResendCode()) {
      return;
    }

    // Validar el campo WhatsApp antes de enviar
    if (this.loginForm.get('whatsapp')?.invalid) {
      this.loginForm.get('whatsapp')?.markAsTouched();
      return;
    }

    const whatsappValue = this.loginForm.getRawValue().whatsapp;

    this.authService.requestLoginCode(whatsappValue).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Código enviado', life: 3000 });
        this.codeSended.set(true);
        this.loginForm.get('whatsapp')?.disable();
        this.startCountdown();
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error.message, life: 3000 });
        this.codeSended.set(false);
      }
    });
  }

  private startCountdown(): void {
    this.countdown.set(30);
    this.canResendCode.set(false);

    // Limpiar intervalo anterior si existe
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      const currentCount = this.countdown();

      if (currentCount <= 1) {
        this.countdown.set(0);
        this.canResendCode.set(true);
        clearInterval(this.countdownInterval);
        this.countdownInterval = 30;
      } else {
        this.countdown.set(currentCount - 1);
      }
    }, 1000);
  }

  // Getters para acceso rápido a los controles del formulario
  get whatsapp() { return this.loginForm.get('whatsapp'); }
  get code() { return this.loginForm.get('code'); }
}
