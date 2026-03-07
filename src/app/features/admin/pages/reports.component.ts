import { Component, OnInit } from '@angular/core';
import { ReportsService } from 'src/app/core/services/reports.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  reports: any[] = [];
  isLoading = true;
  canClearHistory = false;

  constructor(private reportsService: ReportsService) { }

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports() {
    this.isLoading = true;
    this.canClearHistory = false; // Reset lock on reload
    this.reportsService.getShiftsHistory().subscribe({
      next: (data) => {
        this.reports = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando los reportes históricos', err);
        this.isLoading = false;
      }
    });
  }

  getPaymentBadgeClass(status: string): string {
    return status === 'PAGADO' ? 'badge badge-green' : 'badge badge-orange';
  }

  downloadPDF() {
    const data = document.getElementById('report-table-container');
    if (data) {
      this.isLoading = true; // Simular carga para el usuario mientras renderiza

      html2canvas(data, { scale: 2 }).then(canvas => {
        const imgWidth = 208;
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;

        const contentDataURL = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        let position = 0;

        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
        pdf.save('Reporte_Valora_Guardias.pdf');

        this.canClearHistory = true;
        this.isLoading = false;
      }).catch((err: any) => {
        console.error('Error al generar PDF', err);
        this.isLoading = false;
      });
    }
  }

  printReport() {
    window.print();
    this.canClearHistory = true;
  }

  clearAllHistory() {
    Swal.fire({
      title: '¿Borrar todo el historial?',
      text: 'Esta acción eliminará todos los registros de guardias permanentemente. Asegúrate de haber descargado el reporte si lo necesitas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, borrar todo',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.reportsService.clearAllHistory().subscribe({
          next: () => {
            Swal.fire('¡Borrado!', 'El historial ha sido vaciado.', 'success');
            this.loadReports();
          },
          error: (err) => {
            console.error('Error al borrar el historial', err);
            Swal.fire('Error', 'No se pudo borrar el historial.', 'error');
            this.isLoading = false;
          }
        });
      }
    });
  }
}
