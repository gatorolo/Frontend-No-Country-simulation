import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private whatsappNumberSource = new BehaviorSubject<string>('5493415109918');
    whatsappNumber$ = this.whatsappNumberSource.asObservable();

    setWhatsAppNumber(number: string) {
        // Format if needed (remove + and spaces)
        const formatted = number.replace(/\D/g, '');
        this.whatsappNumberSource.next(formatted);
    }

    getWhatsAppNumber(): string {
        return this.whatsappNumberSource.getValue();
    }
}
