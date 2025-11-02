// sistema-ventas-frontend/src/app/modules/categories/modal-category/schema-category.ts
// Definición de los campos del formulario para la creación/edición de categorías
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
              validators: { 
                required: true, 
                maxLength: 100, 
                minLength: 2 
              },
              placeholder: 'Ingrese el nombre de la categoría'
            },
            {
              key: 'descripcion',
              label: 'Descripción',
              type: 'text',
              validators: { 
                required: true, 
                maxLength: 200, 
                minLength: 5 
              },
              placeholder: 'Ingrese una descripción'
            },
            {
              key: 'activo',
              label: 'Estado',
              type: 'select',
              options: [
                { label: 'Activo', value: 'true' },
                { label: 'Inactivo', value: 'false' }
              ],
              validators: { required: true },
              defaultValue: 'true',
              description: 'Las categorías inactivas no se mostrarán en la lista principal'
            },
            {
              key: 'icono_url',
              label: 'Icono',
              type: 'file',
              validators: {
                required: true,
                fileType: ['image/png', 'image/jpeg', 'image/jpg'],
                fileSize: 1 * 1024 * 1024 // 1 MB
              },
              description: 'Suba una imagen para la categoría (PNG, JPG, máximo 1MB)'
            }                
          ]
        }
      ]
    }
  ]
}