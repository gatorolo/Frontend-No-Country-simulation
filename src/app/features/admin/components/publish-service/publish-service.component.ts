import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatchingService } from 'src/app/core/services/matching.service';

@Component({
    selector: 'app-publish-service',
    templateUrl: './publish-service.component.html',
    styleUrls: ['./publish-service.component.css']
})
export class PublishServiceComponent {
    @Input() isVisible = false;
    @Output() close = new EventEmitter<void>();

    serviceForm: FormGroup;

    constructor(private fb: FormBuilder, private matchingService: MatchingService) {
        this.serviceForm = this.fb.group({
            patientName: ['', Validators.required],
            age: ['', [Validators.required, Validators.min(0)]],
            city: ['', Validators.required],
            zone: ['', Validators.required],
            schedule: ['', Validators.required],
            complexity: ['Baja', Validators.required],
            specialty: ['Enfermería', Validators.required]
        });
    }

    onSubmit() {
        if (this.serviceForm.valid) {
            const newService = this.serviceForm.value;

            // Ahora nos suscribimos para que el HttpClient haga el POST a Java
            this.matchingService.publishPost(newService).subscribe({
                next: (response) => {
                    console.log('¡Guardia guardada en la base de datos!', response);

                    this.serviceForm.reset({
                        complexity: 'Baja',
                        specialty: 'Enfermería'
                    });
                    this.close.emit(); // Cerramos el modal solo si salió bien
                },
                error: (err) => {
                    console.error('Error al publicar:', err);

                }
            });
        }
    }

    onCancel() {
        this.serviceForm.reset();
        this.close.emit();
    }
}
