// sistema-ventas-frontend/src/app/modules/users/modal-user/schema-user.ts
export const userFormFields = (catalogs: any) => {
  return [
    {
      type: 'column',
      columns: [
        {
          fields: [
            {
              key: 'id_rol',
              label: 'Rol',
              type: 'select',
              options: catalogs['role'],
              validators: { required: true },
              placeholder: 'Seleccione un rol'
            },
            {
              key: 'nombre_usuario',
              label: 'Nombre de usuario',
              type: 'text',
              validators: { 
                required: true, 
                maxLength: 50,
              },
            },
            {
              key: 'email',
              label: 'Correo electrónico',
              type: 'text',
              validators: { 
                required: true, 
                email: true 
              }
            },
            {
              key: 'password',
              label: 'Contraseña',
              type: 'text',
              validators: { 
                required: true, 
                minLength: 6 
              },
              feedback: 'Mínimo 6 caracteres',
              // Solo requerido para creación, no para edición
              hidden: (data: any) => !!data?.id_usuario
            },
            {
              key: 'nombre_completo',
              label: 'Nombre completo',
              type: 'text',
              validators: { 
                required: true,
                maxLength: 100 
              }
            },
            {
              key: 'telefono',
              label: 'Teléfono',
              type: 'text', // Cambiado de 'number' a 'text'
              validators: { 
                required: false, // Cambiado a opcional
                pattern: '^[0-9+()-]*$',
                maxLength: 20 
              },
              placeholder: 'Opcional'
            }
          ]
        }
      ]
    }
  ];
};