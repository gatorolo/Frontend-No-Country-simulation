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
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http'; // 1. Importamos el cliente HTTP
import { tap } from 'rxjs/operators';

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
    status: 'Activo' | 'Internación' | 'Alta';
}

@Injectable({
    providedIn: 'root'
})
export class PatientService {
    // 2. La URL de tu API en Java
    private apiUrl = 'http://localhost:8080/api/patients';

    private patientsSource = new BehaviorSubject<Patient[]>([]);
    patients$ = this.patientsSource.asObservable();

    constructor(private http: HttpClient) { } // 3. Inyectamos el cliente

    // Método para obtener la lista (opcional, útil para el admin)
    getPatientsFromApi(): Observable<Patient[]> {
        return this.http.get<Patient[]>(this.apiUrl).pipe(
            tap(patients => this.patientsSource.next(patients))
        );
    }

    // 4. ESTE ES EL MÉTODO QUE TE DABA ERROR
    // Ahora devuelve un Observable para que el componente pueda hacer .subscribe()
    updatePatient(id: number, updatedPatient: Patient): Observable<Patient> {
        return this.http.put<Patient>(`${this.apiUrl}/${id}`, updatedPatient).pipe(
            tap(response => {
                // Aquí la lógica de actualizar la lista local si la usas
                this.loadPatients();
            })
        );
    }

    loadPatients() {
        this.getPatientsFromApi().subscribe();
    }

    // Obtener un paciente específico por ID
    getPatientById(id: number): Observable<Patient> {
        return this.http.get<Patient>(`${this.apiUrl}/${id}`);
    }

    // Para compatibilidad con lo que ya tienes (get local)
    getPatients(): Patient[] {
        return this.patientsSource.getValue();
    }

    createPatient(patient: Patient): Observable<Patient> {
        // 1. Enviamos el nuevo paciente al backend Java vía POST
        return this.http.post<Patient>(this.apiUrl, patient).pipe(
            tap(newPatient => {
                // 2. Actualizamos la lista local directamente
                const patients = this.getPatients();
                this.patientsSource.next([...patients, newPatient]);
            })
        );
    }
}
