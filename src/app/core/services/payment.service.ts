import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Settlement {
    id: number;
    caregiverName: string;
    amount: number;
    status: 'Pendiente' | 'Procesado' | 'Factura Pendiente';
    invoiceUploaded: boolean;
}

export interface InsuranceBilling {
    id: number;
    patientName: string;
    insuranceName: string;
    amount: number;
    presentationDate: Date;
    daysDelayed: number;
    status: 'Al día' | 'Atrasado' | 'Crítico';
}

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private settlementsSource = new BehaviorSubject<Settlement[]>([
        { id: 1, caregiverName: 'Lara Martínez', amount: 48000, status: 'Procesado', invoiceUploaded: true },
        { id: 2, caregiverName: 'Carlos Ruiz', amount: 32000, status: 'Pendiente', invoiceUploaded: true },
        { id: 3, caregiverName: 'Elena Paz', amount: 15000, status: 'Factura Pendiente', invoiceUploaded: false },
        { id: 4, caregiverName: 'Carla Vuioner', amount: 28000, status: 'Pendiente', invoiceUploaded: true }
    ]);

    private insuranceBillingSource = new BehaviorSubject<InsuranceBilling[]>([
        { id: 1, patientName: 'Roberto Sánchez', insuranceName: 'OSDE 310', amount: 85000, presentationDate: new Date('2024-01-15'), daysDelayed: 25, status: 'Al día' },
        { id: 2, patientName: 'Marta García', insuranceName: 'Swiss Medical', amount: 120000, presentationDate: new Date('2023-12-01'), daysDelayed: 70, status: 'Crítico' },
        { id: 3, patientName: 'Ricardo Gómez', insuranceName: 'PAMI', amount: 45000, presentationDate: new Date('2023-12-28'), daysDelayed: 43, status: 'Atrasado' }
    ]);

    settlements$ = this.settlementsSource.asObservable();
    insuranceBilling$ = this.insuranceBillingSource.asObservable();

    getKPIs() {
        const settlements = this.settlementsSource.getValue();
        const billing = this.insuranceBillingSource.getValue();

        return {
            totalToPay: settlements.reduce((acc, curr) => acc + curr.amount, 0),
            pendingPayments: settlements.filter(s => s.status === 'Pendiente').reduce((acc, curr) => acc + curr.amount, 0),
            criticalExpirations: billing.filter(b => b.status === 'Crítico').length,
            caregiversToValidate: settlements.filter(s => s.status === 'Factura Pendiente').length
        };
    }

    processPayment(id: number) {
        const list = this.settlementsSource.getValue();
        const index = list.findIndex(s => s.id === id);
        if (index !== -1) {
            list[index].status = 'Procesado';
            this.settlementsSource.next([...list]);
        }
    }
}
