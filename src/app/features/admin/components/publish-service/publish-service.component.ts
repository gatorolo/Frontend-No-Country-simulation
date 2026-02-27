import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatchingService } from 'src/app/core/services/matching.service';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
    selector: 'app-publish-service',
    templateUrl: './publish-service.component.html',
    styleUrls: ['./publish-service.component.css']
})
export class PublishServiceComponent {
    @Input() isVisible = false;
    @Output() published = new EventEmitter<void>();
    @Output() canceled = new EventEmitter<void>();

    serviceForm: FormGroup;

    constructor(private fb: FormBuilder, private matchingService: MatchingService, private notificationService: NotificationService) {
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

            // 1. IMPORTANTE: Faltaba llamar al servicio aquí
            this.matchingService.publishPost(newService).subscribe({
                next: (response) => {
                    console.log('Datos reales de Java:', response);

                    // 2. Ahora 'response' existe y tiene el ID que devuelve el backend
                    this.notificationService.addNotification({
                        title: '¡Nueva Guardia Disponible!',
                        message: `Se busca personal para ${response.patientName} en ${response.city}.`,
                        type: 'info',
                        recipientRole: 'caregiver',
                        relatedPostId: response.id // Esto es vital para que el cuidador pueda "Aplicar"
                    });

                    // 3. Limpiar y cerrar solo si el servidor respondió bien
                    this.serviceForm.reset({
                        complexity: 'Baja',
                        specialty: 'Enfermería'
                    });
                    this.published.emit();
                },
                error: (err) => {
                    console.error('Error al publicar en Java:', err);
                    alert('No se pudo publicar la guardia. Revisa la conexión con el servidor.');
                }
            });
        }
    }

    onCancel() {
        this.canceled.emit();
    }

}
