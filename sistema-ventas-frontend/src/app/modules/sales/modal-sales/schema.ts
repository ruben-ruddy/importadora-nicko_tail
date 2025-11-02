// sistema-ventas-frontend/src/app/modules/sales/modal-sales/schema.ts
// Definición de los campos del formulario para el módulo de ventas
export const saleFormFields = (catalogs: any) => {
  return [
    {
      type: 'column',
      columns: [
        {
          fields: [
            {
              key: 'id_cliente',
              label: 'Cliente',
              type: 'select',
              options: catalogs['clients'],
              validators: { required: false },
            },
            {
              key: 'id_usuario',
              label: 'Vendedor',
              type: 'select',
              options: catalogs['users'],
              validators: { required: true },
            },
            {
              key: 'numero_venta',
              label: 'Número de Venta',
              type: 'text',
              validators: { required: true, maxLength: 50 },
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
            },
          ]
        },
        {
          fields: [
            {
              key: 'subtotal',
              label: 'Subtotal',
              type: 'number',
              validators: { required: true, min: 0 },
              disabled: true
            },
            {
              key: 'descuento',
              label: 'Descuento',
              type: 'number',
              validators: { required: false, min: 0 },
            },
            {
              key: 'impuesto',
              label: 'Impuesto',
              type: 'number',
              validators: { required: false, min: 0 },
            },
            {
              key: 'total',
              label: 'Total',
              type: 'number',
              validators: { required: true, min: 0 },
              disabled: true
            },
          ]
        }
      ]
    },
    {
      type: 'array',
      key: 'detalle_ventas',
      label: 'Productos',
      fields: [
        {
          key: 'id_producto',
          label: 'Producto',
          type: 'select',
          options: catalogs['products'],
          validators: { required: true },
          onChange: (event: any, form: any, index: number) => {
            const selectedProduct = catalogs['products'].find((p: any) => p.value === event.value);
            if (selectedProduct) {
              const precioUnitario = selectedProduct.precio_venta || 0;
              form.get('detalle_ventas').at(index).get('precio_unitario').setValue(precioUnitario);
              updateItemTotal(form, index);
            }
          }
        },
        {
          key: 'cantidad',
          label: 'Cantidad',
          type: 'number',
          validators: { required: true, min: 1 },
          onChange: (event: any, form: any, index: number) => {
            updateItemTotal(form, index);
          }
        },
        {
          key: 'precio_unitario',
          label: 'Precio Unitario',
          type: 'number',
          validators: { required: true, min: 0 },
          onChange: (event: any, form: any, index: number) => {
            updateItemTotal(form, index);
          }
        },
        {
          key: 'subtotal',
          label: 'Subtotal',
          type: 'number',
          validators: { required: true, min: 0 },
          disabled: true
        }
      ]
    },
    {
      key: 'observaciones',
      label: 'Observaciones',
      type: 'textarea',
      validators: { required: false, maxLength: 500 },
    }
  ];
};

// Función para actualizar el subtotal de un ítem y el total de la venta
function updateItemTotal(form: any, index: number) {
  const cantidad = form.get('detalle_ventas').at(index).get('cantidad').value || 0;
  const precioUnitario = form.get('detalle_ventas').at(index).get('precio_unitario').value || 0;
  const subtotal = cantidad * precioUnitario;
  
  form.get('detalle_ventas').at(index).get('subtotal').setValue(subtotal);
  updateSaleTotal(form);
}

// Función para actualizar el total de la venta
function updateSaleTotal(form: any) {
  const detalles = form.get('detalle_ventas').value || [];
  const subtotal = detalles.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
  const descuento = form.get('descuento').value || 0;
  const impuesto = form.get('impuesto').value || 0;
  const total = subtotal - descuento + impuesto;
  
  form.get('subtotal').setValue(subtotal);
  form.get('total').setValue(total);
}