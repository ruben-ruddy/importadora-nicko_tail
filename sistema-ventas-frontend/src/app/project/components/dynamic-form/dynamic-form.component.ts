// dynamic-form.component.ts
import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators,FormArray } from '@angular/forms';
import { ImageModule } from 'primeng/image';

@Component({
  selector: 'dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageModule],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss'
}) 
export class DynamicFormComponent implements OnInit {
  fileErrors: Record<string, string> = {};
  previewFiles: Record<string, string | null> = {};
  @Input() fields: any[] = [];
  @Input() initialData: any = {};

  /** ✅ ahora es una función opcional que recibe el formulario */
  @Input() askfor?: (form: FormGroup) => void;

  @Output() onFormChange = new EventEmitter<any>();

  form!: FormGroup;
  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.form = this.fb.group({});
    this.buildForm(this.fields);
    
    if (this.initialData) {
      this.patchFormWithInitialData();
    }

     setTimeout(() => {
    this.convertNumericStringValues();
  }, 100);

    // ✅ Llamar a la función askfor si está definida
    if (this.askfor) {
      this.askfor(this.form);
    }

    this.subscribeToFormChanges();
  }

  private convertNumericStringValues() {
  Object.keys(this.form.controls).forEach(key => {
    const control = this.form.get(key);
    const value = control?.value;
    
    // Convertir strings numéricos a números
    if (typeof value === 'string' && !isNaN(Number(value)) && value !== '') {
      control?.setValue(Number(value), { emitEvent: false });
    }
  });
}

  private patchFormWithInitialData(): void {
    // Patch valores normales primero
    this.form.patchValue(this.initialData);

    // Manejar arrays específicamente
    this.fields.forEach(field => {
      if (field.type === 'array' && this.initialData[field.key]) {
        const formArray = this.form.get(field.key) as FormArray;
        // Limpiar array existente
        while (formArray.length !== 0) {
          formArray.removeAt(0);
        }
        // Agregar items del initialData
        this.initialData[field.key].forEach((item: any) => {
          formArray.push(this.createArrayItem(field, item));
        });
      }

      // Manejar files (tu código existente)
      if (field.columns) {
        field.columns.forEach((s: any) => {
          s.fields.forEach((fl: any) => {
            if (fl.type === 'file' && this.initialData[fl.key]) {
              this.previewFiles[fl.key] = this.initialData[fl.key];
              this.form.get(fl.key)?.setValue(this.initialData[fl.key]);
            }
          });
        });
      }

      if (field.type === 'file' && this.initialData[field.key]) {
        this.previewFiles[field.key] = this.initialData[field.key];
        this.form.get(field.key)?.setValue(null);
      }
    });
  }

  private subscribeToFormChanges(): void {
    this.form.valueChanges.subscribe(() => {
      const isComplete = this.checkAllRequiredFieldsFilled();

      this.onFormChange.emit({
        data: this.form.getRawValue(),
        valid: this.form.valid,
        touched: this.form.touched,
        dirty: this.form.dirty,
        complete: isComplete
      });
    });
  }
  private checkAllRequiredFieldsFilled(): boolean {
    for (const key in this.form.controls) {
      const control = this.form.get(key);
      const isRequired = control?.hasValidator?.(Validators.required);

      if (isRequired && (control?.invalid || control?.value === '' || control?.value === null)) {
        return false;
      }
    }
    return true;
  }

  buildForm(fields: any[]) {
    fields.forEach(field => {
      if (field.type === 'column') {
        field.columns.forEach((col: any) => {
          col.fields.forEach((f: any) => this.addControl(f));
        });
      } else if (field.type === 'array') {
        this.addArrayControl(field);
      } else if (field.key) {
        this.addControl(field);
      }
    });
  }

    private addArrayControl(field: any) {
    const formArray = this.fb.array([]);
    this.form.addControl(field.key, formArray);

    // Si hay initialData, agregar items
    if (this.initialData && this.initialData[field.key]) {
      this.initialData[field.key].forEach((item: any) => {
        this.addArrayItem(field, item);
      });
    } else if (field.minItems > 0) {
      // Agregar mínimo de items requeridos
      for (let i = 0; i < field.minItems; i++) {
        this.addArrayItem(field);
      }
    }
  }

private createArrayItem(field: any, itemData: any = {}): FormGroup {
  const itemGroup = this.fb.group({});
  
  field.itemFields.forEach((itemField: any) => {
    // Usar valor de itemData, o defaultValue, o vacío
    const defaultValue = itemData[itemField.key] !== undefined 
      ? itemData[itemField.key] 
      : (itemField.defaultValue !== undefined ? itemField.defaultValue : '');
    
    const validators = this.mapValidators(itemField.validators);
    
    itemGroup.addControl(
      itemField.key,
      new FormControl(defaultValue, validators)
    );
  });

  return itemGroup;
}

  addArrayItem(field: any, itemData: any = {}) {
  const formArray = this.form.get(field.key) as FormArray;
  const newItem = this.createArrayItem(field, itemData);
  formArray.push(newItem);

  // Disparar el cálculo de subtotal para el nuevo item
  setTimeout(() => {
    this.calculateNewItemSubtotal(field.key, formArray.length - 1);
  }, 100);
}
// Nuevo método para calcular subtotal de nuevo item
private calculateNewItemSubtotal(arrayKey: string, index: number) {
  const formArray = this.form.get(arrayKey) as FormArray;
  const itemGroup = formArray.at(index) as FormGroup;
  
  const cantidad = Number(itemGroup.get('cantidad')?.value) || 0;
  const precio = Number(itemGroup.get('precio_unitario')?.value) || 0;
  const subtotal = cantidad * precio;
  
  itemGroup.get('subtotal')?.setValue(subtotal, { emitEvent: false });
  
  // Disparar evento de cambio para que el modal recalcule el total
  this.form.updateValueAndValidity();
}
  removeArrayItem(fieldKey: string, index: number) {
    const formArray = this.form.get(fieldKey) as FormArray;
    if (formArray.length > 1) {
      formArray.removeAt(index);
    }
  }

  getFormArray(fieldKey: string): FormArray {
    return this.form.get(fieldKey) as FormArray;
  }



 private addControl(field: any) {
    if (field.type === 'title') return;

    const baseValidators = this.mapValidators(field.validators);
    if (field.type === 'file') {
      baseValidators.push(this.fileValidator(field.validators));
    }

    this.form.addControl(
      field.key,
      new FormControl(
        { value: '', disabled: field.readonly },
        baseValidators
      )
    );
  }


private mapValidators(validators: any): any[] {
  const v: any[] = [];
  if (!validators) return v;
  
  if (validators.required) v.push(Validators.required);
  if (validators.email) v.push(Validators.email);
  if (validators.maxLength !== undefined) v.push(Validators.maxLength(validators.maxLength));
  if (validators.minLength !== undefined) v.push(Validators.minLength(validators.minLength));
  if (validators.pattern) v.push(Validators.pattern(validators.pattern));
  
  // Validadores numéricos
  if (validators.min !== undefined) v.push(Validators.min(validators.min));
  if (validators.max !== undefined) v.push(Validators.max(validators.max));
  
  return v;
}

  getControl(key: string) {
    return this.form.get(key);
  }

  isFieldVisible(field: any): boolean {
    if (!field.showOn) return true;
    const { rules } = field.showOn;
    return rules.every((rule: any) => {
      const val = this.form.get(rule.property)?.value;
      return rule.op === 'eq' ? val === rule.value : true;
    });
  }

  triggerFileInput(key: string): void {
    const input = document.getElementById('fileInput_' + key) as HTMLInputElement;
    input?.click();
  }

 onFileChange(event: Event, key: string): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  this.fileErrors[key] = ''; // Limpiar errores previos

  const control = this.form.get(key);
  const field = this.fields.find(f => f.key === key);
  const validators = field?.validators || {};

  if (!file) {
    control?.setValue(null);
    control?.setErrors(null);
    control?.markAsTouched();
    control?.updateValueAndValidity();
    return;
  }
  // Validar tipo
  if (validators.fileType && !validators.fileType.includes(file.type)) {
    this.fileErrors[key] = 'Tipo de archivo no permitido.';
    control?.setErrors({ fileType: true });
    control?.markAsTouched();
    control?.updateValueAndValidity();
    return;
  }
  // Validar tamaño
  if (validators.fileSize && file.size > validators.fileSize) {
    this.fileErrors[key] = `El archivo supera el tamaño máximo de ${(validators.fileSize / 1024 / 1024).toFixed(1)} MB.`;
    control?.setErrors({ fileSize: true });
    control?.markAsTouched();
    control?.updateValueAndValidity();
    return;
  }
  // Si todo bien, asignar el archivo y previsualización
  control?.setValue(file);
  control?.setErrors(null);
  control?.markAsTouched();
  control?.updateValueAndValidity();

  const reader = new FileReader();
  reader.onload = () => {
    this.previewFiles[key] = reader.result as string;
  };
  reader.readAsDataURL(file);
}

  isImage(fileData: string | null): boolean {
    //console.log(fileData);
    
    return typeof fileData === 'string' && fileData.startsWith('data:image/');
  }

 

  private fileValidator(validators: any) {
  return (control: FormControl) => {
    const value = control.value;

    // Si no hay valor y es requerido
    if (!value) {
      if (validators.required) {
        return { required: true };
      } else {
        return null;
      }
    }

    // Si el valor es un string (por ejemplo, url de archivo ya guardado)
    if (typeof value === 'string') {
      // Solo validamos que no esté vacío si es requerido
      if (validators.required && value.trim() === '') {
        return { required: true };
      }
      // No podemos validar tipo ni tamaño en url, así que pasamos
      return null;
    }

    // Si el valor es un File (cuando se selecciona uno nuevo)
    if (value instanceof File) {
      if (validators.fileType && !validators.fileType.includes(value.type)) {
        return { fileType: true };
      }
      if (validators.fileSize && value.size > validators.fileSize) {
        return { fileSize: true };
      }
    }

    return null; // válido
  };
}


convertToNumber(event: Event, arrayKey: string, index: number, fieldKey: string) {
  const input = event.target as HTMLInputElement;
  const value = input.value;
  
  // Convertir a número si es posible
  if (value !== '' && !isNaN(Number(value))) {
    const formArray = this.form.get(arrayKey) as FormArray;
    const itemGroup = formArray.at(index) as FormGroup;
    itemGroup.get(fieldKey)?.setValue(Number(value), { emitEvent: true });
  }
}

  onSubmit() {
    if (this.form.valid) {
      console.log('Form submitted:', this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onProductChange(arrayKey: string, index: number, fieldKey: string) {
  if (fieldKey === 'id_producto') {
    const formArray = this.form.get(arrayKey) as FormArray;
    const itemGroup = formArray.at(index) as FormGroup;
    const productId = itemGroup.get('id_producto')?.value;
    
    // Buscar el producto seleccionado y actualizar el precio
    const fieldConfig = this.fields.find(f => f.key === arrayKey);
    if (fieldConfig && fieldConfig.itemFields) {
      const productField = fieldConfig.itemFields.find((f: any) => f.key === 'id_producto');
      if (productField && productField.onChange) {
        // Ejecutar la función onChange definida en el schema
        productField.onChange(
          { value: productId },
          this.form,
          index
        );
      }
    }
  }
}


}
