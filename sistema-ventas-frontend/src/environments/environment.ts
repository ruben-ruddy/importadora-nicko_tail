// sistema-ventas-frontend/src/environments/environment.ts
import { environmentDefault } from "./default";

export const environment = {
    ...environmentDefault, 
    production: false,
    backend: 'http://localhost:3000/api',
    apiUrl: 'http://localhost:3000/api',
    backend_file: 'http://localhost:3000',
    jwtKey: 'jwtToken',
    pythonForecastService: 'http://localhost:8000',
    enablePythonService: true,
    enableAdvancedMetrics: true,
    version: '1.0.0',
    companyName: 'Importadora Nicko',
    companyLogo: 'assets/images/nicko.png', // Ruta a tu logo
    companyAddress: 'La Paz - Bolivia',
    companyPhone: '+591 XXX XXX XXX',
    companyTaxId: '123456789'
    // ELIMINA ESTE OBJETO PARA QUE SE USE LA CLAVE DEL DEFAULT.TS
    // recaptcha: {
    //   siteKey: '6Lebp5grAAAAAMS_4bwZ54er5eGPJRIHbIQviKRO',
    // },
};