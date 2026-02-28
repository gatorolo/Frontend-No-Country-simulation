import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Caregiver {
  id?: number;
  caregiverName?: string;  // campo real del backend
  fullName?: string;       // campo usado en el formulario local
  specialty: string;
  dni?: string;
  city?: string;
  hourlyRate?: number;
  phone?: string;
  email?: string;
  address?: string;
  paymentTarget?: string;
  status?: string | boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CaregiverService {
  private apiUrl = 'http://localhost:8080/api/caregivers';


  private caregiversSource = new BehaviorSubject<Caregiver[]>([]);
  caregivers$ = this.caregiversSource.asObservable();

  constructor(private http: HttpClient) { }


  getAllCaregivers(): Observable<Caregiver[]> {
    return this.http.get<Caregiver[]>(this.apiUrl).pipe(
      tap(caregivers => this.caregiversSource.next(caregivers))
    );
  }

  addCaregiver(caregiver: Caregiver): Observable<Caregiver> {
    return this.http.post<Caregiver>(this.apiUrl, caregiver).pipe(
      tap(() => this.getAllCaregivers().subscribe())
    );
  }

  updateCaregiver(id: number, caregiver: Caregiver): Observable<Caregiver> {
    return this.http.put<Caregiver>(`${this.apiUrl}/${id}`, caregiver).pipe(
      tap(() => this.getAllCaregivers().subscribe())
    );
  }

  deleteCaregiver(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.getAllCaregivers().subscribe())
    );
  }

  getCaregiverById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // --- NUEVOS MÉTODOS PARA GUARDIAS (SHIFTS) ---
  startShift(payload: { caregiverId: number, patientName: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl.replace('/caregivers', '')}/shifts/start`, payload);
  }

  stopShift(payload: { caregiverId: number, durationSeconds: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl.replace('/caregivers', '')}/shifts/stop`, payload);
  }

  getActiveShifts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl.replace('/caregivers', '')}/shifts/active`);
  }

  getUnpaidShifts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl.replace('/caregivers', '')}/shifts/unpaid`);
  }

  payShift(shiftId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl.replace('/caregivers', '')}/shifts/${shiftId}/pay`, {});
  }

  // --- NUEVOS MÉTODOS PARA FACTURACIÓN DE PACIENTE ---

  getPatientUnpaidShifts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl.replace('/caregivers', '')}/shifts/patient-unpaid`);
  }

  getUnpaidShiftsByPatientName(patientName: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl.replace('/caregivers', '')}/shifts/patient/${patientName}/unpaid`);
  }

  payPatientShift(shiftId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl.replace('/caregivers', '')}/shifts/${shiftId}/pay-patient`, {});
  }

  // ---------------------------------------------------

  getShiftHistory(caregiverId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl.replace('/caregivers', '')}/shifts/caregiver/${caregiverId}`);
  }
}