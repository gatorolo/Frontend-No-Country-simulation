import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-growth',
    templateUrl: './growth.component.html',
    styleUrls: ['./growth.component.css']
})
export class GrowthComponent implements OnInit {
    targetRole: string | null = null;

    constructor(private router: Router) { }

    ngOnInit(): void {
        this.targetRole = localStorage.getItem('pendingRole');
    }

    proceed() {
        if (!this.targetRole) {
            this.router.navigate(['/login']);
            return;
        }

        switch (this.targetRole) {
            case 'admin':
                this.router.navigate(['/admin']);
                break;
            case 'caregiver':
                this.router.navigate(['/caregiver']);
                break;
            case 'patient':
                this.router.navigate(['/family']);
                break;
            default:
                this.router.navigate(['/admin']);
        }
    }
}
