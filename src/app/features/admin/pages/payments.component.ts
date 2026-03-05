import { Component, OnInit } from '@angular/core';
import { PaymentService, Settlement, InsuranceBilling } from 'src/app/core/services/payment.service';
import { ReportsService } from 'src/app/core/services/reports.service';
import { CaregiverService } from 'src/app/core/services/caregiver.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit {
  kpis: any = {};
  settlements: Settlement[] = [];
  billing: InsuranceBilling[] = [];

  showReceiptModal = false;
  currentSettlement: Settlement | null = null;
  selectedFile: File | null = null;

  patientPayments: any[] = [];

  // Local Storage Keys for hiding processed/paid rows
  private readonly HIDDEN_SETTLEMENTS_KEY = 'valora_hidden_settlements';
  private readonly HIDDEN_BILLING_KEY = 'valora_hidden_billing';
  private readonly HIDDEN_PATIENT_PAYMENTS_KEY = 'valora_hidden_patient_payments';

  hiddenSettlements: number[] = [];
  hiddenBills: number[] = [];
  hiddenPatientPayments: number[] = [];

  constructor(
    private paymentService: PaymentService,
    private reportsService: ReportsService,
    private caregiverService: CaregiverService
  ) { }

  ngOnInit(): void {
    this.loadHiddenState();
    this.loadData();
    this.loadPatientPayments();
  }

  private loadHiddenState() {
    this.hiddenSettlements = JSON.parse(localStorage.getItem(this.HIDDEN_SETTLEMENTS_KEY) || '[]');
    this.hiddenBills = JSON.parse(localStorage.getItem(this.HIDDEN_BILLING_KEY) || '[]');
    this.hiddenPatientPayments = JSON.parse(localStorage.getItem(this.HIDDEN_PATIENT_PAYMENTS_KEY) || '[]');
  }

  public refreshData() {
    this.loadData();
    this.loadPatientPayments();
  }

  public loadData() {
    this.reportsService.getShiftsHistory().subscribe({
      next: (shifts) => {
        // Objeto temporal para agrupar liquidaciones por nombre de cuidador
        const aggregated: Record<string, { totalAmount: number, unpaidShiftIds: number[], status: 'Pendiente' | 'Procesado' }> = {};

        shifts.forEach(shift => {
          const name = shift.caregiverName || 'Desconocido';

          if (!aggregated[name]) {
            aggregated[name] = { totalAmount: 0, unpaidShiftIds: [], status: 'Procesado' };
          }

          // Si el turno está PENDIENTE
          if (shift.paymentStatus === 'PENDIENTE') {
            aggregated[name].totalAmount += (shift.earned || 0);
            aggregated[name].unpaidShiftIds.push(shift.id);
            aggregated[name].status = 'Pendiente';
          }
          // Si el turno está PAGADO pero este cuidador no tiene nada "Pendiente" y tiene historial, sumaremos el histórico
          else if (shift.paymentStatus === 'PAGADO' && aggregated[name].status !== 'Pendiente') {
            aggregated[name].totalAmount += (shift.earned || 0);
          }
        });

        // Convertir el objeto agrupado al array esperado por el HTML
        this.settlements = Object.keys(aggregated).map((caregiverName, index) => {
          const data = aggregated[caregiverName];
          return {
            id: index + 1000, // ID artificial para el frontend array (el UUID no importa para render)
            caregiverName: caregiverName,
            amount: data.totalAmount,
            status: data.status,
            invoiceUploaded: data.status === 'Pendiente', // Simularemos que tienen factura si tienen deuda para que pague
            unpaidShiftIds: data.unpaidShiftIds // Guardamos las ids reales de backend para enviarlas a pagar
          } as any;
        }).filter(item => !this.hiddenSettlements.includes(item.id));

        // Recalcular KPIs si se requiere, de momento solo totalToPay
        this.kpis.totalToPay = this.settlements.reduce((acc, curr) => acc + (curr.status === 'Pendiente' ? curr.amount : 0), 0);
      },
      error: (err) => console.error('Error agrupando las liquidaciones reales', err)
    });

    this.kpis = this.paymentService.getKPIs();
    this.paymentService.insuranceBilling$.subscribe(b => {
      this.billing = b.filter(item => !this.hiddenBills.includes(item.id));
    });
  }

  public loadPatientPayments() {
    this.reportsService.getShiftsHistory().subscribe({
      next: (data) => {
        // Filter out hidden IDs
        this.patientPayments = data.filter(item => !this.hiddenPatientPayments.includes(item.id));
      },
      error: (err) => console.error('Error cargando los pagos de pacientes', err)
    });
  }

  openReceiptModal(settlement: Settlement) {
    this.currentSettlement = settlement;
    this.showReceiptModal = true;
  }

  closeModal() {
    this.showReceiptModal = false;
    this.currentSettlement = null;
    this.selectedFile = null;
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  confirmPayment() {
    if (this.currentSettlement && (this.currentSettlement as any).unpaidShiftIds?.length > 0) {
      const shiftIds: number[] = (this.currentSettlement as any).unpaidShiftIds;

      const requests = shiftIds.map(id => this.caregiverService.payShift(id).toPromise());

      Promise.all(requests).then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Liquidación exitosa',
          text: `Se procesaron los pagos de ${this.currentSettlement!.caregiverName}`,
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
        this.closeModal();
        this.loadData(); // Refrescar con la Base de datos
      }).catch(err => {
        console.error('Error liquidando', err);
        Swal.fire('Error', 'Hubo un problema procesando la liquidación.', 'error');
      });
    } else {
      // Si no hay ids pendientes, solo cerramos
      this.closeModal();
    }
  }

  exportData() {
    console.log('Exporting financial report...');
    // Simulation of export
    Swal.fire({
      icon: 'success',
      title: 'Exportación Exitosa',
      text: 'Reporte exportado exitosamente (Excel/PDF Simulation)',
      confirmButtonColor: 'var(--primary, #0ea5e9)'
    });
  }

  getDelayClass(status: string): string {
    switch (status) {
      case 'Crítico': return 'status-red';
      case 'Atrasado': return 'status-yellow';
      default: return 'status-green';
    }
  }

  // Métodos para Ocultar (Soft Delete en Frontend)
  hideSettlement(id: number, event: Event) {
    event.stopPropagation();
    this.hiddenSettlements.push(id);
    localStorage.setItem(this.HIDDEN_SETTLEMENTS_KEY, JSON.stringify(this.hiddenSettlements));
    this.settlements = this.settlements.filter(s => s.id !== id);
  }

  hideBilling(id: number, event: Event) {
    event.stopPropagation();
    this.hiddenBills.push(id);
    localStorage.setItem(this.HIDDEN_BILLING_KEY, JSON.stringify(this.hiddenBills));
    this.billing = this.billing.filter(b => b.id !== id);
  }

  hidePatientPayment(id: number, event: Event) {
    event.stopPropagation();
    this.hiddenPatientPayments.push(id);
    localStorage.setItem(this.HIDDEN_PATIENT_PAYMENTS_KEY, JSON.stringify(this.hiddenPatientPayments));
    this.patientPayments = this.patientPayments.filter(p => p.id !== id);
  }
}
