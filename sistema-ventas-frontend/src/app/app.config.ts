// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';
import { routes } from './app.routes';
import { AuthInterceptor } from './core/auth.interceptor';
import { HttpBackend, provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { registerLocaleData } from '@angular/common';
import { provideScReCaptchaSettings } from '@semantic-components/re-captcha';


import { es } from 'date-fns/locale/es';

import { DateFnsConfigurationService } from 'ngx-date-fns';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeuix/themes/lara';

// Corregimos la importación para que no use .forRoot()
//import { RECAPTCHA_SETTINGS, RecaptchaSettings, RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha';
import { environment } from '../environments/environment';

import localeEs from '@angular/common/locales/es';

registerLocaleData(localeEs, 'es');

export function HttpLoaderFactory(_httpBackend: HttpBackend) {
  return new MultiTranslateHttpLoader(_httpBackend, [
    '/assets/i18n/',
    '/assets/i18n/zn4-core-forms/',
    '/assets/i18n/zn4-core-browser-2/',
    '/assets/i18n/zn4-core-dms/',
    '/assets/i18n/zn4-core-multiple-upload/',
    '/assets/i18n/zn4-core-table/',
  ]);
}

const dateFnsConfig = new DateFnsConfigurationService();
dateFnsConfig.setLocale(es);

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Lara
      }
    }),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor]), withFetch()),
    provideScReCaptchaSettings({
      v2SiteKey: environment.recaptcha.siteKey,
      v3SiteKey: environment.recaptcha.siteKey,
      languageCode: 'es',
    }),

    // Importación de módulos que no tienen forRoot()
    // La importación de módulos se hace por separado
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpBackend],
        },
        defaultLanguage: 'es'
      }),
      // RecaptchaModule, // Importación del módulo de reCAPTCHA
      // RecaptchaFormsModule // Importación del módulo de formularios de reCAPTCHA
    ),

    { provide: DateFnsConfigurationService, useValue: dateFnsConfig },

    // Configuración global de reCAPTCHA con el siteKey
    // {
    //   provide: RECAPTCHA_SETTINGS,
    //   useValue: {
    //     siteKey: environment.recaptcha.siteKey,
    //   } as RecaptchaSettings,
    // },
    
    TranslateService
  ]
};