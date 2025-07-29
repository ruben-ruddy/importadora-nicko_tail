import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../project/services/api.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})

export class LoginComponent {
  loginForm = this.fb.group({
    nombre_usuario: ['', [Validators.required]],
    password: ['', Validators.required]
  });
   errorMessage: string | null = null; // Propiedad para mensajes de error
  constructor(
    private apiService: ApiService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  onSubmit() {
    if (this.loginForm.valid) {
      const { nombre_usuario, password } = this.loginForm.value;
      this.apiService.login({nombre_usuario:nombre_usuario!, password:password!}).subscribe({
        next: () => this.router.navigate(['/home']),
        error: (err) => console.error('Login failed', err)
      });
    }else {
      this.loginForm.markAllAsTouched(); // Marca todos los campos como tocados para mostrar validaciones
      this.errorMessage = 'Por favor, completa todos los campos.';
    }
  }
}