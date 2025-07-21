import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router } from '@angular/router';
import { ApiService } from '../../project/services/api.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})

export class LoginComponent {
  loginForm = this.fb.group({
    nombre_usuario: ['', [Validators.required]],
    password: ['', Validators.required]
  });

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
    }
  }
}