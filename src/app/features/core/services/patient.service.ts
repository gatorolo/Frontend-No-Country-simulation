import { Injectable } from '@angular/core';
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
}
