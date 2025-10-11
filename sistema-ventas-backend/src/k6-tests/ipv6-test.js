import http from 'k6/http';
import { check } from 'k6';

export default function () {
  console.log('🔧 Testing IPv6 connection...');
  
  // Usar IPv6 explícitamente
  const response = http.get('http://[::1]:4200/home-main', {
    timeout: '30s'
  });

  console.log('Status:', response.status);
  console.log('Body Length:', response.body ? response.body.length : 'NO BODY');
  console.log('Error:', response.error || 'None');

  check(response, {
    'status is 200': (r) => r.status === 200,
    'has content': (r) => r.body && r.body.length > 0,
  });
}

export const options = {
  vus: 1,
  iterations: 1,
};