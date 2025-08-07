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
                  validators: { required: true, maxLength: 100, minLength: 0 },
                },
                {
                  key: 'email',
                  label: 'Correo Electrónico',
                  type: 'text',
                  validators: { required: true, maxLength: 100, minLength: 0 },
                },
                {
                  key: 'telefono',
                  label: 'Celular',
                  type: 'number',
                  validators: { required: true, maxLength: 100, minLength: 0 },
                },
                {
                  key: 'direccion',
                  label: 'Dirección',
                  type: 'text',
                  validators: { required: true, maxLength: 100, minLength: 0 },
                },
                {
                  key: 'documento_identidad',
                  label: 'Cédula de Identidad',
                  type: 'number',
                  validators: { required: true, maxLength: 100, minLength: 0 },
                },
                               
              ]
            },
          ]
        },
       
      ]
    )
   }