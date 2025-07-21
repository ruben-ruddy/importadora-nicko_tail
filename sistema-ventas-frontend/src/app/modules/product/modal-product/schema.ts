

export const productFormFields=(catalogs: any)=> {
    
      return ([
        {

            type: 'title',
            text: 'Producto',
            style: 'title',
        },
        {
          type: 'column',
          columns: [
            {
              fields: [
                
                {
                  key: 'name',
                  label: 'Nombre del Producto',
                  type: 'text',
                  validators: { required: true, maxLength: 50, minLength: 0 },
                },
                {
                  key: 'description',
                  label: 'Descripción',
                  type: 'text',
                  validators: { required: true, maxLength: 100, minLength: 0 },
                },
                {
                  key: 'price',
                  label: 'Precio',
                  type: 'number',
                  validators: { required: true, maxLength: 50, minLength: 0 },
                },
                {
                  key: 'stock',
                  label: 'Cantidad',
                  type: 'number',
                  validators: { required: true },

                },
                {
                  key: 'categoryId',
                  label: 'Categoria',
                  type: 'select',
                  options: catalogs['category'],
                  validators: { required: true },
                },
                {
                  key: 'marcaId',
                  label: 'Marca',
                  type: 'select',
                  options: catalogs['marca'],
                  validators: { required: true },
                },
                {
                  key: 'file',
                  label: 'Imagen',
                  type: 'file',
                  validators: {
                    required: true,
                    fileType: ['image/png', 'image/jpeg'],
                    fileSize: 1 * 1024 * 1024 // 1 MB
                  }
                }
              ]
            },
            
        
          ]
        },
       
      
      ]
    )
   }