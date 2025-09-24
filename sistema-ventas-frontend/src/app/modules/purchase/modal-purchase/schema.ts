// schema.ts (actualizado para usuario automático)
export const purchaseFormFields = (catalogs: any, currentUser: any = null) => {
  const isCurrentUserSet = currentUser && currentUser.id_usuario;
  
  return [
    {
      type: 'column',
      columns: [
        {
          fields: [
            {
              key: 'id_usuario',
              label: 'Usuario Responsable',
              type: 'select',
              options: catalogs['users'] || [],
              validators: { required: true },
              readonly: isCurrentUserSet,
              disabled: isCurrentUserSet,
              defaultValue: isCurrentUserSet ? currentUser.id_usuario : null,
              description: isCurrentUserSet ? 'Usuario actualmente logeado' : 'Seleccione un usuario'
            },
            {
              key: 'estado',
              label: 'Estado',
              type: 'select',
              options: [
                { label: 'Pendiente', value: 'pendiente' },
                { label: 'Completada', value: 'completada' },
                { label: 'Cancelada', value: 'cancelada' }
              ],
              validators: { required: true },
            }
          ]
        },
        {
          fields: [
            {
              key: 'observaciones',
              label: 'Observaciones',
              type: 'text',
              validators: { maxLength: 500 },
              rows: 3
            }
          ]
        }
      ]
    },
    {
      type: 'array',
      key: 'detalle_compras',
      label: 'Detalles de Compra',
      minItems: 1,
      addButtonText: 'Agregar Producto',
      removeButtonText: 'Eliminar',
      itemFields: [
        {
          key: 'id_producto',
          label: 'Producto',
          type: 'select',
          options: catalogs['products'] || [],
          validators: { required: true },
          onChange: (field: any, form: any, index: number) => {
            const selectedProduct = catalogs.products.find((p: any) => p.value === field.value);
            if (selectedProduct) {
              const precioControl = form.get(['detalle_compras', index, 'precio_unitario']);
              if (precioControl) {
                precioControl.setValue(selectedProduct.precio_compra);
              }
            }
          }
        },
        {
          key: 'cantidad',
          label: 'Cantidad',
          type: 'number',
          validators: { required: true, min: 1 },
        },
        {
          key: 'precio_unitario',
          label: 'Precio Unitario',
          type: 'number',
          step: "0.01",
          validators: { required: true, min: 0 },
        },
        {
          key: 'subtotal',
          label: 'Subtotal',
          type: 'number',
          readonly: true,
          step: "0.01"
        }
      ]
    },
    {
      type: 'column',
      columns: [
        {
          fields: [
            {
              key: 'total',
              label: 'Total',
              type: 'number',
              readonly: true,
              step: "0.01",
            }
          ]
        }
      ]
    }
  ];
};