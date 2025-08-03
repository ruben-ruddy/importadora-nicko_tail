// src/app/modules/login/login.component.ts
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../project/services/api.service';
import { env } from 'process';
import { environment } from '../../../environments/environment';
import { ScCheckboxReCaptcha } from '@semantic-components/re-captcha';
import { log } from 'console';
import { ToasterService } from '../../project/services/toaster.service';
//import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    CommonModule, 
    ScCheckboxReCaptcha,
    //RecaptchaModule, 
    //RecaptchaFormsModule // <-- ¡Agregué este módulo aquí!
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  
  loginForm = this.fb.group({
    nombre_usuario: ['', [Validators.required]],
    password: ['', Validators.required],
    captcha: ['', Validators.required] // <-- Este control ya está bien
  });
  errorMessage: string | null = null; // Propiedad para mensajes de error
  siteKey = environment.recaptcha.siteKey; // Asegúrate de que este valor esté definido en tu entorno
  constructor(
    private apiService: ApiService,
    private router: Router,
    private fb: FormBuilder,
    private toastService: ToasterService // Asegúrate de que ApiService tenga el método login
  ) {}

  onSubmit() {
  console.log('Formulario enviado:', this.loginForm.value);
  
    if (this.loginForm.valid) {

      const { nombre_usuario, password } = this.loginForm.value;
      this.apiService.login({nombre_usuario:nombre_usuario!, password:password!}).subscribe({
        next: () => {this.router.navigate(['/home'])
          this.toastService.showToast({
            severity: 'success', 
            summary: 'Inicio de sesión exitoso',
            detail: 'Bienvenido al sistema.',
          });
        },
        error: (err) => {
           this.toastService.showToast({
            severity: 'error', 
            summary: 'Error de inicio de sesión',
            detail: err.error.message || 'Credenciales inválidas o usuario inactivo.',       
        })
        }
      });
    } else {
      console.log('Formulario inválido. Verifica los campos.');
      this.loginForm.markAllAsTouched(); // Marca todos los campos como tocados para mostrar validaciones
      this.errorMessage = 'Por favor, completa todos los campos.';
    }
  }
  
}