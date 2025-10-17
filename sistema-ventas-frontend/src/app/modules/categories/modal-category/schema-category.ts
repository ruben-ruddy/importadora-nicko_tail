// sistema-ventas-frontend/src/app/modules/categories/modal-category/schema-category.ts

export const categoryFormFields = (catalogs: any) => {
  return [
    {
      type: 'column',
      columns: [
        {
          fields: [
            {
              key: 'nombre_categoria',
              label: 'Nombre De Categoria',
              type: 'text',
              validators: { required: true, maxLength: 100, minLength: 0 },
            },
            {
              key: 'descripcion',
              label: 'Descripción',
              type: 'text',
              validators: { required: true, maxLength: 200, minLength: 0 },
            },
            {
              key: 'activo', // CAMPO NUEVO AÑADIDO
              label: 'Estado',
              type: 'select',
              options: [
                { label: 'Activo', value: 'true' },
                { label: 'Inactivo', value: 'false' }
              ],
              validators: { required: true },
              defaultValue: 'true'
            },
            {
              key: 'icono_url',
              label: 'URL del Icono',
              type: 'file',
              validators: {
                required: true,
                fileType: ['image/png', 'image/jpeg'],
                fileSize: 1 * 1024 * 1024 // 1 MB
              },
            },                
          ]
        },
      ]
    },
  ]
}