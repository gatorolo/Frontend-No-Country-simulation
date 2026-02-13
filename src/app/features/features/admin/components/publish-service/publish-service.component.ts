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
            this.matchingService.publishPost(newService);
            this.serviceForm.reset();
            this.close.emit();
        }
    }

    onCancel() {
        this.serviceForm.reset();
        this.close.emit();
    }
}
