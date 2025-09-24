//sistem-ventas-frontend/src/app/modules/clients/modal-clients/schema-clients.ts
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
                  type: 'text', // ✅ CAMBIAR de 'number' a 'text'
                  validators: { 
                    required: false, // ✅ Cambiar a false si es opcional
                    maxLength: 20,
                    pattern: '^[0-9+()-\\s]*$' // Validar que solo tenga números y caracteres de teléfono
                  },
                },
                {
                  key: 'direccion',
                  label: 'Dirección',
                  type: 'text',
                  validators: { required: false, maxLength: 255 }, // ✅ Cambiar a false si es opcional
                },
                {
                  key: 'documento_identidad',
                  label: 'Cédula de Identidad',
                  type: 'text', // ✅ CAMBIAR de 'number' a 'text'
                  validators: { 
                    required: false, // ✅ Cambiar a false si es opcional
                    maxLength: 50,
                    pattern: '^[0-9-]*$' // Validar que solo tenga números y guiones
                  },
                },
                               
              ]
            },
          ]
        },
       
      ]
    )
   }