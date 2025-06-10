import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
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
    InputOtpModule,
    InputGroupModule,
    InputGroupAddonModule,
    FormsModule
  ],
  providers: [MessageService],
  styleUrl: './login.component.css',
  templateUrl: './login.component.html',
})
export default class LoginComponent implements OnInit, OnDestroy {
  // Inyección de dependencias con inject()
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute); // Añadido para obtener query params
  private messageService = inject(MessageService);

  loginForm!: FormGroup;
  isLoading = false;
  codeSended = signal(false);

  // Variables para el contador
  countdown = signal(0);
  canResendCode = signal(true);
  private countdownInterval: any = 30;

  // Variables para el OTP Input
  otpLength = 6;
  otpBoxes = Array(this.otpLength).fill(0);
  otpValues: string[] = Array(this.otpLength).fill('');
  isInvalid = false;
  lastBackspace = false;

  ngOnInit(): void {
    this.initForm();
    this.handleQueryParams(); // Manejar query params al inicializar
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

  // Métodos para el OTP Input
handleInput(event: any, index: number): void {
  const input = event.target;
  let value = input.value;
  
  // Validar que sea número
  if (!/^\d*$/.test(value)) {
    this.isInvalid = true;
    input.value = '';
    this.otpValues[index] = '';
    setTimeout(() => this.isInvalid = false, 1000);
    return;
  }
  
  // Limitar a un solo dígito
  if (value.length > 1) {
    value = value.slice(0, 1);
    input.value = value;
  }
  
  this.otpValues[index] = value;
  this.updateOtpFormValue();
  
  // Si se ingresó un número y no es el último campo, mover al siguiente
  if (value && index < this.otpLength - 1) {
    const nextInput = document.querySelectorAll('.otp-box')[index + 1] as HTMLInputElement;
    nextInput.focus();
  }
  
  // Si el campo actual está vacío y no es el primero, mover al anterior
  if (!value && index > 0) {
    const prevInput = document.querySelectorAll('.otp-box')[index - 1] as HTMLInputElement;
    prevInput.focus();
  }
}

  handleKeyDown(event: KeyboardEvent, index: number): void {
  const input = event.target as HTMLInputElement;
  
  // Manejar backspace
  if (event.key === 'Backspace') {
    // Si el campo está vacío, retroceder al anterior y borrar su valor
    if (!input.value && index > 0) {
      event.preventDefault();
      const prevInput = document.querySelectorAll('.otp-box')[index - 1] as HTMLInputElement;
      prevInput.value = '';
      this.otpValues[index - 1] = '';
      this.updateOtpFormValue();
      prevInput.focus();
    }
    
    // Limpiar el valor actual si hay algo
    if (input.value) {
      input.value = '';
      this.otpValues[index] = '';
      this.updateOtpFormValue();
    }
    return;
  }
  
  // Permitir solo números, teclas de control y navegación
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
      
      this.updateOtpFormValue();
      
      // Enfocar el último campo
      const lastInput = document.querySelectorAll('.otp-box')[this.otpLength - 1] as HTMLInputElement;
      lastInput.focus();
    }
  }

  

  updateOtpFormValue(): void {
    this.loginForm.get('code')?.setValue(this.otpValues.join(''));
  }

  // Nuevo método para manejar query params
  private handleQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      const whatsappParam = params['whatsapp'];

      if (whatsappParam) {
        // Establecer el valor del WhatsApp en el formulario
        this.loginForm.get('whatsapp')?.setValue(whatsappParam);

        // Deshabilitar el campo WhatsApp ya que viene de registro
        this.loginForm.get('whatsapp')?.disable();

        // Marcar que el código ya fue enviado
        this.codeSended.set(true);

        // Iniciar el contador
        this.startCountdown();

        // Mostrar mensaje informativo
        this.messageService.add({
          severity: 'info',
          summary: 'Código enviado',
          detail: 'Se ha enviado un código de verificación a tu WhatsApp',
          life: 4000
        });

        // Limpiar los query params para evitar problemas en recargas
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
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

  onlyNumbers(event: KeyboardEvent): boolean {
    const allowedKeys = [
      8,  // backspace
      9,  // tab
      13, // enter
      37, // left arrow
      38, // up arrow
      39, // right arrow
      40, // down arrow
      46  // delete
    ];

    const charCode = event.which || event.keyCode;
    
    // Permitir teclas de control
    if (allowedKeys.includes(charCode)) {
      return true;
    }

    // Permitir solo números (teclado principal y numpad)
    if ((charCode >= 48 && charCode <= 57) || (charCode >= 96 && charCode <= 105)) {
      return true;
    }

    event.preventDefault();
    return false;
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
    this.loginForm.get('whatsapp')?.setValue(value, { emitEvent: true });

    // Forzar la actualización del valor en el input
    input.value = value;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    // Obtener valores, considerando que whatsapp puede estar deshabilitado
    const whatsappValue = this.loginForm.get('whatsapp')?.value || this.loginForm.getRawValue().whatsapp;
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

    // Obtener el valor del WhatsApp (considerando que puede estar deshabilitado)
    const whatsappValue = this.loginForm.get('whatsapp')?.value || this.loginForm.getRawValue().whatsapp;

    // Validar el campo WhatsApp antes de enviar
    if (!whatsappValue || this.whatsappValidator({ value: whatsappValue } as AbstractControl)) {
      if (!this.loginForm.get('whatsapp')?.disabled) {
        this.loginForm.get('whatsapp')?.markAsTouched();
      }
      return;
    }

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

  // Nuevo método para permitir cambiar el número de WhatsApp
  enableWhatsappEdit(): void {
    this.loginForm.get('whatsapp')?.enable();
    this.codeSended.set(false);
    this.canResendCode.set(true);
    this.countdown.set(0);

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = 30;
    }

    // Limpiar el código
    this.loginForm.get('code')?.setValue('');
    this.otpValues = Array(this.otpLength).fill('');
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

  // Getter para verificar si el WhatsApp está deshabilitado (viene de registro)
  get isWhatsappFromRegister(): boolean {
    return this.loginForm.get('whatsapp')?.disabled || false;
  }
}