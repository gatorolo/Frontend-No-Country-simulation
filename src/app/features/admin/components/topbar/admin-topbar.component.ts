import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin-topbar',
    templateUrl: './admin-topbar.component.html',
    styleUrls: ['./admin-topbar.component.css']
})
export class AdminTopbarComponent {

    @Output() menuClick = new EventEmitter<void>();

    constructor(private router: Router) { }

    onLogout() {
        this.router.navigate(['/login']);
    }
}
