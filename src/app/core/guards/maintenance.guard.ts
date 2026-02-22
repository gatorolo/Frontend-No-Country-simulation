import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { ConfigService } from '../services/config.service';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class MaintenanceGuard implements CanActivate, CanActivateChild {

    constructor(private configService: ConfigService, private router: Router) { }

    canActivate(): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        const isMaintenance = this.configService.getConfig().system.maintenanceMode;

        if (isMaintenance) {
            Swal.fire({
                icon: 'warning',
                title: 'Sistema en Mantenimiento',
                text: 'Lo sentimos, el sistema se encuentra temporalmente en mantenimiento. Solo los administradores pueden acceder en este momento.',
                confirmButtonText: 'Entendido',
                confirmButtonColor: 'var(--primary, #0ea5e9)'
            });

            // Redirect to login or just block
            return this.router.parseUrl('/login');
        }

        return true;
    }

    canActivateChild(): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        return this.canActivate();
    }
}
