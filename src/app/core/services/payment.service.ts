import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { catchError, startWith, switchMap, tap } from 'rxjs/operators';

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

import { API_BASE_URL } from '../constants/api.constants';

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private apiUrl = `${API_BASE_URL}/payments`;

    private settlementsSource = new BehaviorSubject<Settlement[]>([]);
    private insuranceBillingSource = new BehaviorSubject<InsuranceBilling[]>([]);

    settlements$ = this.settlementsSource.asObservable();
    insuranceBilling$ = this.insuranceBillingSource.asObservable();

    constructor(private http: HttpClient) {
        this.loadSettlements().subscribe();
        this.loadInsuranceBilling().subscribe();

        interval(15000).pipe(
            startWith(0),
            switchMap(() => this.loadSettlements().pipe(catchError(() => of([]))))
        ).subscribe();

        interval(15000).pipe(
            startWith(0),
            switchMap(() => this.loadInsuranceBilling().pipe(catchError(() => of([]))))
        ).subscribe();
    }

    private loadSettlements(): Observable<Settlement[]> {
        return this.http.get<Settlement[]>(`${this.apiUrl}/settlements`).pipe(
            tap(data => this.settlementsSource.next(data))
        );
    }

    private loadInsuranceBilling(): Observable<InsuranceBilling[]> {
        return this.http.get<InsuranceBilling[]>(`${this.apiUrl}/insurance-billing`).pipe(
            tap(data => this.insuranceBillingSource.next(data))
        );
    }

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
            // En un futuro: This should be an API call to Java to close the debt.
        }
    }
}
