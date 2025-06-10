import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Toast } from 'primeng/toast';
import AuthService from '../services/auth.service';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-whatsapp',
  imports: [CardModule, FormsModule, ButtonModule, Toast, CommonModule],
  providers: [MessageService],
  styleUrl:'./verify-whatsapp.component.css',
  templateUrl: './verify-whatsapp.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VerifyWhatsappComponent {
  authService = inject(AuthService);
  PLATFORM_ID = inject(PLATFORM_ID);
  router = inject(Router);
  verifyng: boolean = false;

  // Variables para el OTP Input - CORRECCIÓN AQUÍ
  otpLength = 6;
  otpBoxes = Array.from({ length: this.otpLength }, (_, i) => i); // Cambio aquí
  otpValues: string[] = Array(this.otpLength).fill('');
  isInvalid = false;
  lastBackspace = false;

  constructor(private messageService: MessageService) { }

  // Métodos para el OTP Input
  handleInput(event: any, index: number): void {
    const input = event.target;
    let value = input.value;
    
    if (!/^\d*$/.test(value)) {
      this.isInvalid = true;
      input.value = '';
      this.otpValues[index] = '';
      setTimeout(() => this.isInvalid = false, 1000);
      return;
    }
    
    if (value.length > 1) {
      value = value.slice(0, 1);
      input.value = value;
    }
    
    this.otpValues[index] = value;
    
    if (value && index < this.otpLength - 1) {
      const nextInput = document.querySelectorAll('.otp-box')[index + 1] as HTMLInputElement;
      nextInput.focus();
    }
    
    if (!value && index > 0) {
      const prevInput = document.querySelectorAll('.otp-box')[index - 1] as HTMLInputElement;
      prevInput.focus();
    }
  }

  handleKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    
    if (event.key === 'Backspace') {
      if (!input.value && index > 0) {
        event.preventDefault();
        const prevInput = document.querySelectorAll('.otp-box')[index - 1] as HTMLInputElement;
        prevInput.value = '';
        this.otpValues[index - 1] = '';
        prevInput.focus();
      }
      
      if (input.value) {
        input.value = '';
        this.otpValues[index] = '';
      }
      return;
    }
    
    if (!/^\d$/.test(event.key) && 
        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) {
      event.preventDefault();
      this.isInvalid = true;
      setTimeout(() => this.isInvalid = false, 1000);
    }
  }

  handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text/plain').replace(/\D/g, '');
    
    if (pasteData && pasteData.length === this.otpLength) {
      for (let i = 0; i < this.otpLength; i++) {
        this.otpValues[i] = pasteData[i];
        const input = document.querySelectorAll('.otp-box')[i] as HTMLInputElement;
        input.value = pasteData[i];
      }
      
      const lastInput = document.querySelectorAll('.otp-box')[this.otpLength - 1] as HTMLInputElement;
      lastInput.focus();
    }
  }

  isOtpComplete(): boolean {
    return this.otpValues.join('').length === this.otpLength;
  }

  verifyCode() {
    this.verifyng = true;
    const code = this.otpValues.join('');

    if (code.length < 6) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Ingrese los 6 dígitos',
        life: 3000
      });
      this.verifyng = false;
      return;
    }

    this.authService.verificar_codigo(code).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Código verificado correctamente',
          life: 3000
        });

        this.verifyng = false;
        this.router.navigate(['/productos']);
        this.authService.checkAuthStatus();

        if (isPlatformBrowser(this.PLATFORM_ID)) {
          window.location.reload();
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error.error || 'Error en la verificación del código',
          life: 3000
        });
        this.verifyng = false;
      },
      complete: () => {
        this.verifyng = false;
      }
    });
  }
}