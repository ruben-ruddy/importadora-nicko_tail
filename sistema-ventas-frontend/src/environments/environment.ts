// sistema-ventas-frontend/src/environments/environment.ts
import { environmentDefault } from "./default";

export const environment = {
    ...environmentDefault, 
    production: false,
    backend: 'http://localhost:3000/api',
    jwtKey: 'jwtToken',
    // ELIMINA ESTE OBJETO PARA QUE SE USE LA CLAVE DEL DEFAULT.TS
    // recaptcha: {
    //   siteKey: '6Lebp5grAAAAAMS_4bwZ54er5eGPJRIHbIQviKRO',
    // },
};