import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/core/services/config.service';
import { PatientService } from 'src/app/core/services/patient.service';
import { MatchingService } from 'src/app/core/services/matching.service';
import { NotificationService } from 'src/app/core/services/notification.service';

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
    private matchingService: MatchingService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    // 1. WhatsApp Link
    this.configService.whatsappNumber$.subscribe(num => {
      this.whatsappLink = `https://wa.me/${num}`;
    });

    // 2. Carga de Paciente
    this.patientService.loadPatients(); // Forzamos carga al entrar
    this.patientService.patients$.subscribe(patients => {
      if (patients && patients.length > 0) {
        const p = patients.find(patient => (patient as any).id === this.currentPatientId) || patients[patients.length - 1];

        if (p) {
          const data = p as any;
          this.patientData = {
            ...data,
            name: data.name || data.patientName,
            age: data.age || data.patientAge,
            insurance: data.healthInsurance || data.insurance,
            location: data.locationLink || data.location,
            caregiver: this.patientData?.caregiver || { fullName: 'Buscando...', specialty: '-' }
          };

          this.checkMatchingForPatient();
        }
      }
    });

    // 3. Suscripción a Notificaciones Reales (Canal de Notificaciones)
    this.notificationService.notifications$.subscribe(notifs => {
      // Filtramos las notificaciones para el rol 'family'
      const familyNotifs = notifs.filter(n => n.recipientRole === 'family');

      // Si recibimos nuevas, aumentamos el contador si son recientes
      if (familyNotifs.length > this.notifications.length) {
        const diff = familyNotifs.length - this.notifications.length;
        this.unreadCount += diff;
      }
      this.notifications = familyNotifs;
    });
  }

  private checkMatchingForPatient() {
    this.matchingService.posts$.subscribe(posts => {
      if (!this.patientData) return;

      // Buscamos un servicio que esté 'Confirmado' para este paciente
      const confirmedService = posts.find(post => {
        const matchNombre = post.patientName?.trim().toLowerCase() === this.patientData.name?.trim().toLowerCase();
        const matchStatus = post.status === 'Confirmado';
        return matchNombre && matchStatus;
      });

      if (confirmedService) {
        this.updateCaregiverInfo(confirmedService);
      }
    });
  }

  private updateCaregiverInfo(service: any) {
    const nombreCuidador = service.caregiverName || 'Cuidador Asignado';

    // Solo actualizamos si el nombre cambió o no estaba asignado
    if (this.patientData && (!this.patientData.caregiver || this.patientData.caregiver.fullName !== nombreCuidador)) {
      this.patientData.caregiver = {
        fullName: nombreCuidador,
        specialty: service.specialty || 'Especialista en Gerontología'
      };
    }
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.unreadCount = 0;
    }
  }

  onEdit() {
    if (this.patientData && this.patientData.id) {
      this.router.navigate(['/family', this.patientData.id]);
    } else {
      this.router.navigate(['/family']);
    }
  }

  onLogout() {
    this.router.navigate(['/login']);
  }
}
