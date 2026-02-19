import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Caregiver {
  id?: number;
  fullName: string;
  specialty: string;
  dni?: string;
  zone: string;
  hourlyRate?: number;
  phone?: string;
  status?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CaregiverService {
  private apiUrl = 'http://localhost:8080/api/caregivers';

  // Usamos BehaviorSubject para que el Admin vea la lista actualizada al instante
  private caregiversSource = new BehaviorSubject<Caregiver[]>([]);
  caregivers$ = this.caregiversSource.asObservable();

  constructor(private http: HttpClient) { }

  // 1. Obtener todos los cuidadores (Para la tabla del Admin)
  getAllCaregivers(): Observable<Caregiver[]> {
    return this.http.get<Caregiver[]>(this.apiUrl).pipe(
      tap(caregivers => this.caregiversSource.next(caregivers))
    );
  }

  // 2. Guardar el nuevo cuidador que viene del Formulario de Admin
  addCaregiver(caregiver: Caregiver): Observable<Caregiver> {
    return this.http.post<Caregiver>(this.apiUrl, caregiver).pipe(
      tap(() => {
        // Refrescamos la lista después de añadir uno nuevo
        this.getAllCaregivers().subscribe();
      })
    );
  }

  // 3. Eliminar (opcional, por si el Admin se equivoca)
  deleteCaregiver(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.getAllCaregivers().subscribe())
    );
  }
}