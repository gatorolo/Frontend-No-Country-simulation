import { Component, OnInit } from '@angular/core';
import { PaymentService, Settlement, InsuranceBilling } from 'src/app/core/services/payment.service';
import { ReportsService } from 'src/app/core/services/reports.service';
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
    private reportsService: ReportsService
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

  private loadData() {
    this.paymentService.settlements$.subscribe(s => {
      this.settlements = s.filter(item => !this.hiddenSettlements.includes(item.id));
      this.kpis = this.paymentService.getKPIs();
    });
    this.paymentService.insuranceBilling$.subscribe(b => {
      this.billing = b.filter(item => !this.hiddenBills.includes(item.id));
    });
  }

  private loadPatientPayments() {
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
    if (this.currentSettlement) {
      this.paymentService.processPayment(this.currentSettlement.id);
      // Simulate notification
      console.log('Payment processed. Notification sent to caregiver.');
      this.closeModal();
      // In a real app, logic for file upload would go here
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
