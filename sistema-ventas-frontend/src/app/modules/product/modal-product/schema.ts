//sistema-ventas-frontend/src/app/modules/product/modal-product/schema.ts

export const productFormFields=(catalogs: any)=> {
    
      return ([
        {
          type: 'column',
          columns: [
            {
              fields: [
                
                {
                  key: 'id_categoria',
                  label: 'Categoria',
                  type: 'select', 
                  options: catalogs['category'],
                  validators: { required: true},
                },
                {
                  key: 'codigo_producto',
                  label: 'Código del Producto',
                  type: 'text',
                  validators: { required: true, maxLength: 100, minLength: 0 },
                },
                {
                  key: 'nombre_producto',
                  label: 'Nombre del Producto',
                  type: 'text',
                  validators: { required: true, maxLength: 100, minLength: 0 },
                },
                {
                  key: 'descripcion',
                  label: 'Descripción',
                  type: 'text',
                  validators: { required: true, maxLength: 50, minLength: 0 },
                },
                {
                  key: 'precio_venta',
                  label: 'Precio de Venta',
                  type: 'number',
                  validators: { required: true },

                },
                
              ]
            },

            {
              fields: [
                {
                  key: 'precio_compra',
                  label: 'Precio de Compra',
                  type: 'number',
                  validators: { required: true },

                },
                {
                  key: 'stock_actual',
                  label: 'Stock Actual',
                  type: 'number',
                  validators: { required: true },

                },
                {
                  key: 'stock_minimo',
                  label: 'Stock Mínimo',
                  type: 'number',
                  validators: { required: true },

                },
                {
                  key: 'imagen_url',
                  label: 'URL de Imagen',
                  type: 'file',
                  validators: {
                    required: true,
                    fileType: ['image/png', 'image/jpeg'],
                    fileSize: 1 * 1024 * 1024 // 1 MB
                  },

                },
                {
                  key: 'activo', // CAMBIADO A SELECT
                  label: 'Estado',
                  type: 'select',
                  options: [
                    { label: 'Activo', value: true },
                    { label: 'Inactivo', value: false }
                  ],
                  validators: { required: true },
                  defaultValue: true
                }
              ]
            }
            
        
          ]
        },
       
      
      ]
    )
   }