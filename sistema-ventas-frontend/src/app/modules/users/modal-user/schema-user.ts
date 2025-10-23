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
              options: catalogs['role'] || [],
              validators: { 
                required: true 
              },
              placeholder: 'Seleccione un rol'
            },
            {
              key: 'nombre_usuario',
              label: 'Nombre de usuario',
              type: 'text',
              validators: { 
                required: true, 
                maxLength: 50,
                minLength: 3,
                pattern: '^[a-zA-Z0-9_]+$'
              },
              placeholder: 'Solo letras, números y _',
              description: 'No usar espacios ni caracteres especiales'
            },
            {
              key: 'email',
              label: 'Correo electrónico',
              type: 'text',
              validators: { 
                required: true, 
                email: true,
                maxLength: 100
              },
              placeholder: 'ejemplo@correo.com'
            },
            {
              key: 'password',
              label: 'Contraseña',
              type: 'text',
              validators: { 
                required: (data: any) => !data?.id_usuario, // Solo requerido para nuevos
                minLength: 6,
                maxLength: 100
              },
              placeholder: 'Mínimo 6 caracteres',
              description: 'Deje en blanco si no desea cambiar la contraseña',
              hidden: (data: any) => !!data?.id_usuario // Ocultar en edición
            },
            {
              key: 'nombre_completo',
              label: 'Nombre completo',
              type: 'text',
              validators: { 
                required: true,
                maxLength: 100,
                minLength: 2
              },
              placeholder: 'Ingrese el nombre completo'
            },
            {
              key: 'telefono',
              label: 'Teléfono',
              type: 'text',
              validators: { 
                required: false,
                pattern: '^[0-9+()-\\s]*$',
                maxLength: 20,
                minLength: 8
              },
              placeholder: 'Opcional - solo números y +',
              description: 'Mínimo 8 dígitos'
            }
          ]
        }
      ]
    }
  ];
};