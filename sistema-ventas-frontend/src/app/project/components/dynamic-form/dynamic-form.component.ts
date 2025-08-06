import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
      console.log('asd');
      
      this.form.patchValue(this.initialData);
      //  Solo para el file
      this.fields.forEach(f => {
        if(f.columns){
          f.columns.forEach((s:any) =>{
             s.fields.forEach((fl:any)=>{
              if (fl.type === 'file' && this.initialData[fl.key]) {
                  this.previewFiles[fl.key] = this.initialData[fl.key];
                   this.form.get(fl.key)?.setValue(this.initialData[fl.key]);
                }
             })
          })

        }
        
        if (f.type === 'file' && this.initialData[f.key]) {
          this.previewFiles[f.key] = this.initialData[f.key];
           // puede ser una URL
          this.form.get(f.key)?.setValue(null); // o mantenerlo vacío hasta subir uno nuevo
        }
      });
    }

    // ✅ Llamar a la función askfor si está definida
    if (this.askfor) {
      this.askfor(this.form);
    }

    this.subscribeToFormChanges();
  }
  private subscribeToFormChanges(): void {
    this.form.valueChanges.subscribe(() => {
      const isComplete = this.checkAllRequiredFieldsFilled();

      this.onFormChange.emit({
        data: this.form.getRawValue(), // obtiene valores incluso de campos deshabilitados
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
      } else if (field.key) {
        this.addControl(field);
      }
    });
  }

 private addControl(field: any) {
  if (field.type === 'title') return;

  const baseValidators = this.mapValidators(field.validators);
  // Agregar validador de archivo si es tipo file
  if (field.type === 'file') {
    baseValidators.push(this.fileValidator(field.validators));

  }

  this.form.addControl(field.key, new FormControl({ value: '', disabled: field.readonly }, baseValidators));
}

  private mapValidators(validators: any): any[] {
    const v: any[] = [];
    if (!validators) return v;
    if (validators.required) v.push(Validators.required);
    if (validators.email) v.push(Validators.email);
    if (validators.maxLength !== undefined) v.push(Validators.maxLength(validators.maxLength));
    if (validators.minLength !== undefined) v.push(Validators.minLength(validators.minLength));
    if (validators.pattern) v.push(Validators.pattern(validators.pattern));
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
    console.log(fileData);
    
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


  onSubmit() {
    if (this.form.valid) {
      console.log('Form submitted:', this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
