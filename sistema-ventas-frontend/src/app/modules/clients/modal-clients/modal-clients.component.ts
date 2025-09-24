// sistema-ventas-frontend/src/app/modules/clients/modal-clients/modal-clients.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormGroup } from '@angular/forms';
import { ClientsService } from '../clients.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { ApiService } from '../../../project/services/api.service';
import { environment } from '../../../../environments/environment';
import { clientsFormFields } from './schema-clients';

@Component({
  selector: 'app-modal-clients',
  imports: [CommonModule, DynamicFormComponent],
  templateUrl: './modal-clients.component.html',
  styleUrl: './modal-clients.component.scss'
})
export class ModalClientsComponent implements OnInit {

  dynamicDialogConfig = inject(DynamicDialogConfig);
  formReference!: FormGroup;
  isEdit: boolean = false;
  public formData: any;
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
  };
  initiaData = this.dynamicDialogConfig.data?.data;
  catalogs: any = {};
  public view = false
  constructor(
    public ref: DynamicDialogRef,
    private clientsService: ClientsService,
    private toaster: ToasterService,
    private apiService: ApiService
  ) { }

  async ngOnInit() {
    this.catalogs.CRISTAL = [];
    this.view = true;
    this.isEdit = !!this.initiaData?.id_cliente;
    this.initiaData.icono_url = `${environment.backend_file}${this.initiaData.icono_url}`;
    // Si es edición, asegurar que icono_url sea string
    if (this.initiaData) {
      this.initiaData = {
        ...this.initiaData,
        icono_url: this.initiaData.icono_url || ''
      };
    }
  }

  PatientsFormFields(catalogs: any): any[] {
    return clientsFormFields(catalogs);
  }

  handleFormChange(event: {
    data: any;
    valid: boolean;
    touched: boolean;
    dirty: boolean;
    complete: boolean;
  }) {
    this.formData = event;
  }

async save() {
  if (this.formData?.valid) {
    try {
      const formData = {...this.formData.data};
      
      // ✅ Convertir números a strings si es necesario
      if (typeof formData.telefono === 'number') {
        formData.telefono = formData.telefono.toString();
      }
      
      if (typeof formData.documento_identidad === 'number') {
        formData.documento_identidad = formData.documento_identidad.toString();
      }
      
      if (this.isEdit) {
        await this.clientsService.updateClients(
          this.initiaData.id_cliente,
          formData
        );
        this.toaster.showToast({
          severity: 'success',
          summary: 'Actualizado',
          detail: 'Cliente actualizado correctamente'
        });
      } else {
        await this.clientsService.createClients(formData);
        this.toaster.showToast({
          severity: 'success',
          summary: 'Creado',
          detail: 'Cliente creado correctamente'
        });
      }

      this.ref.close(true);
    } catch (error: any) {
      console.error('Error saving client:', error);
      let detail = 'Error al guardar el cliente';
      
      if (error.error?.message) {
        detail = error.error.message;
      }
      
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: detail
      });
    }
  }
}

  close() {
    this.ref.close();
  }

}