// sistema-ventas-frontend/src/app/modules/report/export.service.ts
import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  // Exportar a PDF
  async exportToPDF(elementId: string, filename: string): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Elemento no encontrado para exportar a PDF');
      }

      // Ocultar botones y elementos no deseados temporalmente
      const elementsToHide = element.querySelectorAll('button, .bg-gray-400');
      elementsToHide.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Restaurar elementos ocultos
      elementsToHide.forEach(el => {
        (el as HTMLElement).style.display = '';
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190; // Ancho menor para márgenes
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`${filename}.pdf`);
      
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      throw new Error('No se pudo generar el PDF');
    }
  }

  // Exportar a Excel
  exportToExcel(data: any[], filename: string, sheetName: string = 'Reporte'): void {
    try {
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
      const workbook: XLSX.WorkBook = {
        Sheets: { [sheetName]: worksheet },
        SheetNames: [sheetName]
      };

      const excelBuffer: any = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });

      this.saveAsExcelFile(excelBuffer, filename);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      throw new Error('No se pudo generar el Excel');
    }
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(data);
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Exportar múltiples hojas de Excel
  exportMultipleSheetsToExcel(sheets: { name: string; data: any[] }[], filename: string): void {
    try {
      const workbook: XLSX.WorkBook = { Sheets: {}, SheetNames: [] };

      sheets.forEach(sheet => {
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(sheet.data);
        workbook.Sheets[sheet.name] = worksheet;
        workbook.SheetNames.push(sheet.name);
      });

      const excelBuffer: any = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });

      this.saveAsExcelFile(excelBuffer, filename);
    } catch (error) {
      console.error('Error al exportar múltiples hojas a Excel:', error);
      throw new Error('No se pudo generar el Excel con múltiples hojas');
    }
  }
}