// sistema-ventas-frontend/src/app/modules/clients/modal-clients/modal-clients.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
import { FormGroup } from '@angular/forms';
import { ClientsService } from '../clients.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { ApiService } from '../../../project/services/api.service';
import { environment } from '../../../../environments/environment';
import { clientsFormFields } from './schema-clients';
import { ModalService } from '../../../project/services/modal.service';

@Component({
  selector: 'app-modal-clients',
  imports: [CommonModule, DynamicFormComponent],
  templateUrl: './modal-clients.component.html',
  styleUrl: './modal-clients.component.scss'
})
export class ModalClientsComponent implements OnInit {
  @Input() modalData: any = {};
  @Input() modalConfig: any = {};

  formReference!: FormGroup;
  isEdit: boolean = false;
  public formData: any;
  
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
  };
  
  initialData: any = {};
  catalogs: any = {};
  public view = false;

  constructor(
    private clientsService: ClientsService,
    private toaster: ToasterService,
    private apiService: ApiService,
    private modalService: ModalService
  ) { }

  // Ciclo de vida del componente
  async ngOnInit() {
    console.log('ModalClientsComponent - modalData:', this.modalData);
    console.log('ModalClientsComponent - modalConfig:', this.modalConfig);
    
    this.catalogs.CRISTAL = [];
    this.view = true;
    
    if (this.modalData?.data) {

      this.initialData = { ...this.modalData.data };
      this.isEdit = !!this.modalData.data.id_cliente;
    } else if (this.modalData?.id_cliente) {

      this.initialData = { ...this.modalData };
      this.isEdit = true;
    } else {
  
      this.initialData = {};
      this.isEdit = false;
    }

    console.log('ModalClientsComponent - initialData:', this.initialData);
    console.log('ModalClientsComponent - isEdit:', this.isEdit);


    if (this.isEdit) {
      this.initialData = {
        ...this.initialData,
        
        email: this.initialData.email || '',
        telefono: this.initialData.telefono || '',
        direccion: this.initialData.direccion || '',
        documento_identidad: this.initialData.documento_identidad || ''
      };
    } else {
      
      this.initialData = {
        email: '',
        telefono: '',
        direccion: '',
        documento_identidad: ''
      };
    }

    console.log('Datos iniciales preparados:', this.initialData);
  }


  // Definir los campos del formulario
  ClientsFormFields(catalogs: any): any[] {
    return clientsFormFields(catalogs);
  }

  // Manejar cambios en el formulario
  handleFormChange(event: {
    data: any;
    valid: boolean;
    touched: boolean;
    dirty: boolean;
    complete: boolean;
  }) {
    this.formData = event;
    console.log('Form changed - valid:', this.formData?.valid, 'data:', this.formData?.data);
  }

  // Guardar el cliente (crear o actualizar)
  async save() {
    console.log('Save called - form valid:', this.formData?.valid);
    console.log('Current form data:', this.formData?.data);
    
    if (this.formData?.valid) {
      try {
        const formData = {...this.formData.data};
        console.log('Datos del formulario antes de procesar:', formData);
        
        const preparedData = this.prepareDataForBackend(formData);
        console.log('Datos preparados para enviar:', preparedData);
        
        if (this.isEdit) {
          console.log('Actualizando cliente:', this.initialData.id_cliente);
          await this.clientsService.updateClients(
            this.initialData.id_cliente,
            preparedData
          );
          this.toaster.showToast({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Cliente actualizado correctamente'
          });
        } else {
          console.log('Creando nuevo cliente');
          await this.clientsService.createClients(preparedData);
          this.toaster.showToast({
            severity: 'success',
            summary: 'Creado',
            detail: 'Cliente creado correctamente'
          });
        }

        this.modalService.close(true);
      } catch (error: any) {
        console.error('Error saving client:', error);
        let detail = 'Error al guardar el cliente';
        
        if (error.error?.message) {
          detail = error.error.message;
        } else if (error.status === 400) {
          detail = 'Datos inválidos. Verifique la información ingresada.';
        }
        
        this.toaster.showToast({
          severity: 'error',
          summary: 'Error',
          detail: detail
        });
      }
    } else {
      console.log('Formulario inválido');
      if (this.formReference) {
        this.formReference.markAllAsTouched();
      }
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor complete todos los campos requeridos correctamente'
      });
    }
  }

  // Preparar los datos antes de enviarlos al backend
  private prepareDataForBackend(formData: any): any {
    const preparedData: any = {};
    
    if (formData.nombre_completo) {
      preparedData.nombre_completo = formData.nombre_completo.trim();
    }
    
    if (formData.email && formData.email.trim() !== '') {
      preparedData.email = formData.email.trim().toLowerCase();
    } else {
      preparedData.email = null; 
    }
    
    if (formData.telefono && formData.telefono.toString().trim() !== '') {
      let telefono = formData.telefono.toString().trim();
      telefono = telefono.replace(/[^0-9+]/g, '');
      preparedData.telefono = telefono || null;
    } else {
      preparedData.telefono = null;
    }
    
    if (formData.direccion && formData.direccion.trim() !== '') {
      preparedData.direccion = formData.direccion.trim();
    } else {
      preparedData.direccion = null;
    }
    
    if (formData.documento_identidad && formData.documento_identidad.toString().trim() !== '') {
      let documento = formData.documento_identidad.toString().trim();
      documento = documento.replace(/[^0-9-]/g, '');
      preparedData.documento_identidad = documento || null;
    } else {
      preparedData.documento_identidad = null;
    }
    
    console.log('Datos finales preparados para backend:', preparedData);
    return preparedData;
  }

  // Cerrar el modal sin guardar
  close() {
    this.modalService.close();
  }
}