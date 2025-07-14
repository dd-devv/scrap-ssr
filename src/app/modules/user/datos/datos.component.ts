import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import AuthService from '../../auth/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { InputMask } from 'primeng/inputmask';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { Dialog } from 'primeng/dialog';
import { catchError, map, Observable, of } from 'rxjs';
import { InputOtp } from 'primeng/inputotp';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-datos',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    InputMask,
    InputTextModule,
    FloatLabel,
    PasswordModule,
    ButtonModule,
    Toast,
    Dialog,
    InputOtp,
    ToggleSwitch,
    MessageModule
  ],
  providers: [MessageService],
  templateUrl: './datos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DatosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  updateForm!: FormGroup;
  passwordChangeForm!: FormGroup;
  verificationForm!: FormGroup;

  isLoading = false;
  isLoadingPass = false;
  showPasswordChangeForm = false;
  showWhatsappVerificationModal = false;
  originalWhatsapp = '';

  userData: any = null;

  ngOnInit(): void {
    this.loadUserData();
    this.initForms();
  }

  loadUserData(): void {
    this.isLoading = true;
    this.userData = this.authService.currentUser();
    this.originalWhatsapp = this.userData.whatsapp.replace(/\s/g, '');
    this.isLoading = false;
  }

  initForms(): void {
    // Solo inicializa el formulario si tenemos datos del usuario
    if (!this.userData) return;

    // Formulario principal de actualización
    this.updateForm = this.fb.group({
      fullname: [this.userData.fullname, [
        Validators.required,
        Validators.minLength(6)
      ]],
      email: [this.userData.email, [
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
      whatsapp: [this.userData.whatsapp, {
        validators: [
          Validators.required,
          this.whatsappValidator
        ],
        asyncValidators: [this.whatsappAsyncValidator()],
        updateOn: 'blur'
      }]
    });

    // Formulario para cambio de contraseña
    this.passwordChangeForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(6)
      ]]
    });

    // Formulario para verificación de WhatsApp
    this.verificationForm = this.fb.group({
      verificationCode: ['', [
        Validators.required,
        Validators.pattern(/^\d{6}$/)
      ]]
    });

    // Detectar cambios en el número de WhatsApp
    this.updateForm.get('whatsapp')?.valueChanges.subscribe(value => {
      const cleanedValue = value?.replace(/\s/g, '');
      if (cleanedValue !== this.originalWhatsapp && cleanedValue && cleanedValue.length === 9) {
        // Solo marca el campo para validación asíncrona si es un número diferente y válido
        // this.updateForm.get('whatsapp')?.updateValueAndValidity();
      }
    });
  }

  // Validador sincrónico para WhatsApp (reutilizado del componente original)
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

      // Si es el mismo número que ya tenía, no necesitamos validarlo
      if (cleaned === this.originalWhatsapp) {
        return of(null);
      }

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

  // Manejar envío del formulario principal
  onSubmit(): void {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const fullnameValue = this.updateForm.get('fullname')?.value;
    const emailValue = this.updateForm.get('email')?.value;
    const whatsappValue = this.updateForm.get('whatsapp')?.value;

    // Eliminar espacios del número de WhatsApp
    const whatsapp = whatsappValue?.replace(/\s/g, '');

    // Verificar si se cambió el número de WhatsApp
    if (whatsapp !== this.originalWhatsapp) {
      this.requestWhatsappVerification(whatsapp);
      return;
    }

    // Si no se cambió el número, actualizar directamente
    this.updateUserProfile(fullnameValue, emailValue, whatsapp);
  }

  // Solicitar verificación de WhatsApp
  requestWhatsappVerification(whatsapp: string): void {
    this.isLoading = true;
    this.authService.requestWhatsappVerificationCode(whatsapp).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.showWhatsappVerificationModal = true;
        this.messageService.add({
          severity: 'success',
          summary: 'Código enviado',
          detail: 'Se ha enviado un código de verificación a tu nuevo número de WhatsApp',
          life: 3000
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error.error || 'No se pudo enviar el código de verificación',
          life: 3000
        });
      }
    });
  }

  // Verificar código de WhatsApp
  verifyWhatsappCode(): void {
    if (this.verificationForm.invalid) {
      this.verificationForm.markAllAsTouched();
      return;
    }

    const code = this.verificationForm.get('verificationCode')?.value;
    const whatsapp = this.updateForm.get('whatsapp')?.value.replace(/\s/g, '');

    this.isLoading = true;
    this.authService.verifyCodeUpdate(code).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.showWhatsappVerificationModal = false;

        // Una vez verificado el WhatsApp, actualizar el perfil
        const fullnameValue = this.updateForm.get('fullname')?.value;
        const emailValue = this.updateForm.get('email')?.value;

        this.updateUserProfile(fullnameValue, emailValue, whatsapp);
      },
      error: (error) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error.error || 'Código de verificación incorrecto',
          life: 3000
        });
      }
    });
  }

  // Actualizar perfil de usuario
  updateUserProfile(fullname: string, email: string, whatsapp: string): void {
    this.isLoading = true;
    this.authService.updateProfile(fullname, email, whatsapp).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.originalWhatsapp = whatsapp; // Actualizar el WhatsApp original
        this.messageService.add({
          severity: 'success',
          summary: 'Perfil actualizado',
          detail: 'Tu información ha sido actualizada correctamente',
          life: 3000
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error.error || 'No se pudo actualizar tu perfil',
          life: 3000
        });
      }
    });
  }

  // Mostrar/ocultar formulario de cambio de contraseña
  togglePasswordChangeForm(): void {
    this.showPasswordChangeForm = !this.showPasswordChangeForm;
    if (!this.showPasswordChangeForm) {
      this.passwordChangeForm.reset();
    }
  }

  // Enviar solicitud de cambio de contraseña
  changePassword(): void {
    if (this.passwordChangeForm.invalid) {
      this.passwordChangeForm.markAllAsTouched();
      return;
    }

    const currentPassword = this.passwordChangeForm.get('currentPassword')?.value;
    const newPassword = this.passwordChangeForm.get('newPassword')?.value;

    this.isLoadingPass = true;
    this.authService.updatePassword(currentPassword, newPassword).subscribe({
      next: (res) => {
        this.isLoadingPass = false;
        this.passwordChangeForm.reset();
        this.showPasswordChangeForm = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Contraseña actualizada',
          detail: 'Tu contraseña ha sido actualizada correctamente',
          life: 3000
        });
      },
      error: (error) => {
        this.isLoadingPass = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error.error || 'La contraseña actual es incorrecta',
          life: 3000
        });
      }
    });
  }

  // Método para verificar si un campo ha sido tocado o modificado
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  // Método para obtener mensajes de error específicos según el tipo de error
  getErrorMessage(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);

    if (!field || !field.errors) return '';

    const errors = field.errors;

    // Mensajes de error para campos del formulario principal
    if (formGroup === this.updateForm) {
      // Mensajes de error para email
      if (fieldName === 'email') {
        if (errors['required']) return 'El correo electrónico es requerido';
        if (errors['email'] || errors['pattern']) return 'Ingrese un correo electrónico válido';
      }

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
    }

    // Mensajes de error para el formulario de cambio de contraseña
    if (formGroup === this.passwordChangeForm) {
      if (fieldName === 'currentPassword') {
        if (errors['required']) return 'La contraseña actual es requerida';
      }

      if (fieldName === 'newPassword') {
        if (errors['required']) return 'La nueva contraseña es requerida';
        if (errors['minlength']) {
          const requiredLength = errors['minlength'].requiredLength;
          return `La nueva contraseña debe tener al menos ${requiredLength} caracteres`;
        }
      }
    }

    // Mensajes de error para el formulario de verificación
    if (formGroup === this.verificationForm) {
      if (fieldName === 'verificationCode') {
        if (errors['required']) return 'El código de verificación es requerido';
        if (errors['pattern']) return 'El código debe contener 6 dígitos';
      }
    }

    return 'Campo inválido';
  }

  // Cancelar el proceso de cambio de WhatsApp
  cancelWhatsappChange(): void {
    this.showWhatsappVerificationModal = false;
    this.verificationForm.reset();

    // Restaurar el WhatsApp original en el formulario
    this.updateForm.get('whatsapp')?.setValue(this.originalWhatsapp);
  }

  // Getters para acceso rápido a los controles del formulario principal
  get fullname() { return this.updateForm.get('fullname'); }
  get email() { return this.updateForm.get('email'); }
  get whatsapp() { return this.updateForm.get('whatsapp'); }

  // Getters para el formulario de cambio de contraseña
  get currentPassword() { return this.passwordChangeForm.get('currentPassword'); }
  get newPassword() { return this.passwordChangeForm.get('newPassword'); }

  // Getter para el código de verificación
  get verificationCode() { return this.verificationForm.get('verificationCode'); }

  updateUserOnlyHisLow(): void {
    this.authService.updateUserOnlyHisLow(this.userData.onlyHisLow).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Se guardó correctamente',
          detail: 'Se guardó tus preferencias',
          life: 3000
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error al guardar',
          detail: 'Ocurrió un error al guardar sus preferencias',
          life: 3000
        });
      }
    });

  }

}
