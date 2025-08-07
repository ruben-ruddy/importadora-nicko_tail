// sistema-ventas-frontend/src/app/modules/categories/modal-category/schema-category.ts
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
                            validators: { required: true }
                        },
                        {
                            key: 'nombre_usuario',
                            label: 'Nombre de usuario',
                            type: 'text',
                            validators: { required: true, maxLength: 50 }
                        },
                        {
                            key: 'email',
                            label: 'Correo electrónico',
                            type: 'text',
                            validators: { required: true, email: true }
                        },
                        {
                            key: 'password',
                            label: 'Contraseña',
                            type: 'text',
                            validators: { required: true, minLength: 6 },
                        },
                        {
                            key: 'nombre_completo',
                            label: 'Nombre completo',
                            type: 'text',
                            validators: { required: true }
                        },
                        {
                            key: 'telefono',
                            label: 'Teléfono',
                            type: 'number',
                            validators: { required: true }
                        }
                    ]
                }
            ]
        }
    ];
};