// sistema-ventas-frontend/src/app/modules/product/modal-product/modal-product.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
import { FormGroup } from '@angular/forms';
import { productFormFields } from './schema';
import { ProductService } from '../product.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { ApiService } from '../../../project/services/api.service';
import { environment } from '../../../../environments/environment';


@Component({
  selector: 'app-modal-product',
  imports: [CommonModule, DynamicFormComponent],
  standalone: true,
  templateUrl: './modal-product.component.html',
  styleUrl: './modal-product.component.scss',

})
export class ModalProductComponent implements OnInit {
  dynamicDialogConfig = inject(DynamicDialogConfig);
  formReference!: FormGroup;
  public formData: any;
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
  };
  initiaData = this.dynamicDialogConfig.data?.data;
  catalogs: any = {};
  public view = false
  constructor(
    public ref: DynamicDialogRef,
    private productService: ProductService,
    private toaster: ToasterService,
    private apiService: ApiService
  ) { }

  async ngOnInit() {
    if(this.initiaData){
      console.log("initiaData", this.initiaData );
      this.initiaData.imagen_url = `${environment.backend_file}${this.initiaData.imagen_url}`;
      
      
    }
    
    const category: any = await this.productService.getCategories()

    this.catalogs.category = category.map((res: any) => ({
      label: res.nombre_categoria,
      value: res.id_categoria,
    }));
    console.log("catalogs", this.catalogs );
    
    this.view = true
  }

  PatientsFormFields(catalogs: any): any[] {
    return productFormFields(catalogs)
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
      console.log("formData", this.initiaData );
      this.formData.data.precio_compra = parseInt(this.formData.data.precio_compra);
       this.formData.data.precio_venta = parseInt(this.formData.data.precio_venta);
       this.formData.data.stock_actual = parseInt(this.formData.data.stock_actual);
       this.formData.data.stock_minimo = parseInt(this.formData.data.stock_minimo);
      if (this.initiaData?.id_producto) {
      const file = await this.saveFile(this.formData.data.imagen_url);
       
       this.formData.data.imagen_url = file.url;
        this.productService.updateProducts(this.initiaData.id_producto,this.formData.data).then(res => {
          this.ref.close(res);
        });
      } else {
        const file = await this.saveFile(this.formData.data.imagen_url);
        console.log("file", file );
        
       this.formData.data.imagen_url = file.url;
       console.log("formData.data", this.formData.data );
       
       
       console.log("formData", this.formData );
       
        this.productService.createProducts(this.formData.data).then(res => {
          this.toaster.showToast({
            severity: 'success',
            summary: 'Guardado',
            detail: this.initiaData ? 'Los datos se actualizaron correctamente' : 'Los datos se guardaron correctamente',
          });
          this.ref.close(res);
        });

      }

    }else {
        console.log("no valid");
    }
  }



  async saveFile(file: any) {
    if (typeof file == 'object') {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'documento');
      formData.append('user', 'user1');
      const r: any = await this.apiService.postDms(formData);
      return r;
    } else {
      return file;
    }

  }

  


  close() {
    this.ref.close();
  }
}