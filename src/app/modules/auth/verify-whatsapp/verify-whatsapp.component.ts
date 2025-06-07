import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputOtp } from 'primeng/inputotp';
import { Toast } from 'primeng/toast';
import AuthService from '../services/auth.service';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-verify-whatsapp',
  imports: [CardModule, FormsModule, InputOtp, ButtonModule, Toast],
  providers: [MessageService],
  templateUrl: './verify-whatsapp.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VerifyWhatsappComponent {
  authService = inject(AuthService);
  PLATFORM_ID = inject(PLATFORM_ID);
  router = inject(Router);
  value: string = '';
  verifyng: boolean = false;

  constructor(private messageService: MessageService) { }

  verifyCode() {
    this.verifyng = true;

    if (this.value.trim().length < 6) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Ingrese los 6 dígitos',
        life: 3000
      });
      this.verifyng = false;
      return;
    }

    this.authService.verificar_codigo(this.value).subscribe({
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

        if (isPlatformBrowser(PLATFORM_ID)) {
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
