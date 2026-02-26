import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Caregiver {
  id?: number;
  fullName: string;
  specialty: string;
  dni?: string;
  city: string;
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
}