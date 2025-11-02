//sistem-ventas-frontend/src/app/modules/clients/modal-clients/schema-clients.ts
// Definición de los campos del formulario para el módulo de clientes
export const clientsFormFields=(catalogs: any)=> {
    return ([
        {
          type: 'column',
          columns: [
            {
              fields: [
                {
                  key: 'nombre_completo',
                  label: 'Nombre Completo',
                  type: 'text',
                  validators: { required: true, maxLength: 150, minLength: 2 },
                },
                {
                  key: 'email',
                  label: 'Correo Electrónico',
                  type: 'text',
                  validators: { 
                    required: false,
                    maxLength: 100,
                    email: true
                  },
                },
                {
                  key: 'telefono',
                  label: 'Celular',
                  type: 'text', 
                  validators: { 
                    required: false,
                    maxLength: 20,
                    pattern: '^[0-9+()-\\s]*$' 
                  },
                },
                {
                  key: 'direccion',
                  label: 'Dirección',
                  type: 'text',
                  validators: { required: false, maxLength: 255 }, 
                },
                {
                  key: 'documento_identidad',
                  label: 'Cédula de Identidad',
                  type: 'text', 
                  validators: { 
                    required: false, 
                    maxLength: 50,
                    pattern: '^[0-9-]*$' 
                  },
                },
                               
              ]
            },
          ]
        },
       
      ]
    )
   }