import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métricas personalizadas
const errorRate = new Rate('errors');
const responseTimeTrend = new Trend('response_times');
const successCounter = new Counter('successful_requests');

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.05'],
  },
  
  stages: [
    { duration: '1m', target: 10 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 100 },
  ],
};

export default function () {
  const BASE_URL = 'http://[::1]:4200';
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.8,en;q=0.5',
  };

  const homeResponse = http.get(`${BASE_URL}/home-main`, { headers });
  
  // ✅ LÓGICA CORREGIDA - Status 200 es ÉXITO
  const homeChecks = check(homeResponse, {
    '✅ Status es 200': (r) => r.status === 200,
    '✅ Response time < 3s': (r) => r.timings.duration < 3000,
    '✅ Body no está vacío': (r) => r.body.length > 1000,
  });

  // CORRECCIÓN: Status 200 = ÉXITO, no error
  const isSuccess = homeChecks && homeResponse.status === 200;
  
  if (isSuccess) {
    successCounter.add(1);
    errorRate.add(false);
    // ✅ Opcional: Log de éxito ocasional
    if (Math.random() < 0.01) { // Solo loguear 1% de los éxitos
      console.log(`✅ Request exitoso: ${homeResponse.status} - ${homeResponse.timings.duration}ms`);
    }
  } else {
    errorRate.add(true);
    // ✅ Solo loguear errores reales (status ≠ 200)
    if (homeResponse.status !== 200) {
      console.log(`❌ Error real: Status ${homeResponse.status} - ${homeResponse.error}`);
    } else {
      // Si status es 200 pero fallaron otras checks (ej: tiempo > 3s)
      console.log(`⚠️  Advertencia: Status 200 pero tiempo ${homeResponse.timings.duration}ms`);
    }
  }
  
  responseTimeTrend.add(homeResponse.timings.duration);
  sleep(Math.random() * 2 + 1);
}

export function setup() {
  console.log('🚀 Iniciando prueba de estrés CORREGIDA...');
}