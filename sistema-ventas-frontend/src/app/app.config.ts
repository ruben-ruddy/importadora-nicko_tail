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
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { es } from 'date-fns/locale/es';
import { DateFnsConfigurationService } from 'ngx-date-fns';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
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
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor]), withFetch()),
    provideScReCaptchaSettings({
      v2SiteKey: environment.recaptcha.siteKey,
      v3SiteKey: environment.recaptcha.siteKey,
      languageCode: 'es',
    }),

    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpBackend],
        },
        fallbackLang: 'es'
      })
    ),

    { provide: DateFnsConfigurationService, useValue: dateFnsConfig },
    TranslateService,
    provideCharts(withDefaultRegisterables())
  ]
};