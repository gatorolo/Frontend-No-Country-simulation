import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/core/services/config.service';
import { PatientService } from 'src/app/core/services/patient.service';
// 1. IMPORTANTE: Agregamos la importación que faltaba
import { MatchingService } from 'src/app/core/services/matching.service';

@Component({
  selector: 'app-family-view',
  templateUrl: './family-view.component.html',
  styleUrls: ['./family-view.component.css']
})
export class FamilyViewComponent implements OnInit {
  whatsappLink = '';
  patientData: any = null;
  currentPatientId = 1;
  notifications: any[] = [];
  unreadCount = 0;
  showNotifications = false;

  constructor(
    private router: Router,
    private configService: ConfigService,
    private patientService: PatientService,
    // 2. IMPORTANTE: Inyectamos el servicio aquí
    private matchingService: MatchingService
  ) { }

  ngOnInit(): void {
    this.configService.whatsappNumber$.subscribe(num => {
      this.whatsappLink = `https://wa.me/${num}`;
    });

    this.patientService.patients$.subscribe(patients => {
      const p = patients.find(patient => patient.id === this.currentPatientId);
      if (p) {
        this.patientData = {
          ...p,
          insurance: p.healthInsurance,
          location: p.locationLink,
          caregiver: {
            name: 'Lara Martínez',
            specialty: 'Enfermería'
          }
        };
      }
    });

    // 3. Escucha de Matching corregida
    this.matchingService.posts$.subscribe(posts => {
      if (this.patientData) {
        const confirmedService = posts.find(p =>
          p.patientName === this.patientData.name &&
          p.status === 'Confirmado'
        );
        if (confirmedService) {
          this.handleNewMatchNotification(confirmedService);
        }
      }
    });
  } // <--- AQUÍ TERMINA EL ngOnInit

  // 4. Métodos fuera del ngOnInit
  private handleNewMatchNotification(service: any) {
    const exists = this.notifications.some(n => n.id === service.id);
    if (!exists) {
      const newNotif = {
        id: service.id,
        title: '¡Cuidador Asignado!',
        message: `${service.caregiverName} ha sido confirmado para ${service.patientName}.`,
        date: new Date()
      };
      this.notifications = [newNotif, ...this.notifications];
      this.unreadCount++;
      
      if (this.patientData) {
        this.patientData.caregiver = { 
          name: service.caregiverName, 
          specialty: service.specialty 
        };
      }
    }
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) this.unreadCount = 0;
  }

  onEdit() {
    this.router.navigate(['/family']);
  }

  onLogout() {
    this.router.navigate(['/login']);
  }
}