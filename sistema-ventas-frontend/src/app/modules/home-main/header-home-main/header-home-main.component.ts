import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common'; // Asegúrate de importar CommonModule
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { RouterModule } from '@angular/router'; // ¡Importante!

@Component({
  selector: 'app-header-home-main', // Selector ajustado para este componente específico
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
}