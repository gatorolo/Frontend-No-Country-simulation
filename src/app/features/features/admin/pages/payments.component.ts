import { Component, OnInit } from '@angular/core';
import { PaymentService, Settlement, InsuranceBilling } from 'src/app/core/services/payment.service';

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

  constructor(private paymentService: PaymentService) { }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData() {
    this.paymentService.settlements$.subscribe(s => {
      this.settlements = s;
      this.kpis = this.paymentService.getKPIs();
    });
    this.paymentService.insuranceBilling$.subscribe(b => {
      this.billing = b;
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
    alert('Reporte exportado exitosamente (Excel/PDF Simulation)');
  }

  getDelayClass(status: string): string {
    switch (status) {
      case 'Crítico': return 'status-red';
      case 'Atrasado': return 'status-yellow';
      default: return 'status-green';
    }
  }
}
