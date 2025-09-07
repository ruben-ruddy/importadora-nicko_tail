//sistema-ventas-frontend/src/app/modules/home-main/header-home-main/header-home-main.component.ts
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header-home-main',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header-home-main.component.html',
  styleUrls: ['./header-home-main.component.scss']
})
export class HeaderHomeMainComponent implements OnInit, OnDestroy {
  isMenuOpen: boolean = false;
  isDesktop: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreenSize();

      fromEvent(window, 'resize')
        .pipe(
          debounceTime(100),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.checkScreenSize();
        });
    } else {
      this.isDesktop = true;
      this.isMenuOpen = true;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkScreenSize(): void {
    if (isPlatformBrowser(this.platformId)) {
      const previousIsDesktop = this.isDesktop;
      this.isDesktop = window.innerWidth >= 768;

      if (previousIsDesktop !== this.isDesktop) {
        console.log(`HeaderHomeMain: Modo de pantalla cambiado a: ${this.isDesktop ? 'Escritorio' : 'Móvil'}`);
      }

      if (this.isDesktop) {
        this.isMenuOpen = true;
      } else {
        this.isMenuOpen = false;
      }
    }
  }

  toggleMenu(): void {
    if (!this.isDesktop) {
      this.isMenuOpen = !this.isMenuOpen;
      console.log('HeaderHomeMain: Menu isMenuOpen:', this.isMenuOpen);
    }
  }

  // MÉTODO NUEVO AÑADIDO - Cierra el menú en móvil
  closeMenu(): void {
    if (!this.isDesktop) {
      this.isMenuOpen = false;
      console.log('HeaderHomeMain: Menú cerrado');
    }
  }

  // HostListener para cerrar menú al hacer clic fuera (opcional)
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.isDesktop && this.isMenuOpen) {
      const target = event.target as HTMLElement;
      const menu = document.querySelector('.nav');
      const button = document.querySelector('button[aria-label="Toggle menu"]');
      
      if (menu && !menu.contains(target) && button && !button.contains(target)) {
        this.closeMenu();
      }
    }
  }
}