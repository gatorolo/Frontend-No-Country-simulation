/*import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Medication {
    name: string;
    schedule: string;
}

export interface Patient {
    id: number;
    name: string;
    age: number;
    diagnosis: string;
    healthInsurance: string;
    locationLink: string;
    medications: Medication[];
    authorizedCaregivers: number[];
    status: 'Activo' | 'Internación' | 'Alta';
}

@Injectable({
    providedIn: 'root'
})
export class PatientService {
    private patientsSource = new BehaviorSubject<Patient[]>([
        {
            id: 1,
            name: 'Roberto Sánchez',
            age: 78,
            diagnosis: 'Alzheimer en etapa temprana e Hipertensión',
            healthInsurance: 'OSDE 310',
            locationLink: 'https://www.google.com/maps/...',
            medications: [
                { name: 'Enalapril 10mg', schedule: '08:00, 20:00' },
                { name: 'Memantina 10mg', schedule: '09:00' }
            ],
            authorizedCaregivers: [101],
            status: 'Activo'
        }
    ]);

    patients$ = this.patientsSource.asObservable();

    getPatients(): Patient[] {
        return this.patientsSource.getValue();
    }

    updatePatient(updatedPatient: Patient) {
        const patients = this.getPatients();
        const index = patients.findIndex(p => p.id === updatedPatient.id);
        if (index !== -1) {
            patients[index] = updatedPatient;
            this.patientsSource.next([...patients]);
        }
    }

    addPatient(patient: Patient) {
        const patients = this.getPatients();
        this.patientsSource.next([...patients, patient]);
    }
}*/

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap, startWith, switchMap, catchError } from 'rxjs/operators';

export interface Medication {
    name: string;
    schedule: string;
}

export interface Patient {
    id?: number;
    name: string;
    age: number;
    diagnosis: string;
    healthInsurance: string;
    locationLink: string;
    medications: Medication[];
    authorizedCaregivers: number[];
    status: 'Activo' | 'Internación' | 'Alta' | 'Pendiente';
}

@Injectable({
    providedIn: 'root'
})
export class PatientService {
    private apiUrl = 'http://localhost:8080/api/patients';

    private patientsSource = new BehaviorSubject<Patient[]>([]);
    patients$ = this.patientsSource.asObservable();

    constructor(private http: HttpClient) {
        // Sincronización automática: cada 5 segundos refrescamos la lista
        interval(5000).pipe(
            startWith(0),
            switchMap(() => this.getPatientsFromApi().pipe(
                catchError(err => {
                    console.warn('Error en el refresco automático de pacientes:', err.message);
                    return of([] as Patient[]);
                })
            ))
        ).subscribe(patients => {
            if (patients && patients.length > 0) {
                console.log(`🔄 Sincronización: ${patients.length} pacientes cargados.`);
            }
        });
    }

    getPatientsFromApi(): Observable<Patient[]> {
        return this.http.get<Patient[]>(this.apiUrl).pipe(
            tap(patients => this.patientsSource.next(patients))
        );
    }

    updatePatient(id: number, updatedPatient: Patient): Observable<Patient> {
        return this.http.put<Patient>(`${this.apiUrl}/${id}`, updatedPatient).pipe(
            tap(() => this.loadPatients())
        );
    }

    loadPatients() {
        this.getPatientsFromApi().subscribe();
    }

    getPatientById(id: number): Observable<Patient> {
        return this.http.get<Patient>(`${this.apiUrl}/${id}`);
    }

    getPatients(): Patient[] {
        return this.patientsSource.getValue();
    }

    createPatient(patient: Patient): Observable<Patient> {
        return this.http.post<Patient>(this.apiUrl, patient).pipe(
            tap(newPatient => {
                const patients = this.getPatients();
                this.patientsSource.next([...patients, newPatient]);
            })
        );
    }
}
