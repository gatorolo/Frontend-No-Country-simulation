
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigService } from 'src/app/core/services/config.service';
import { PatientService } from 'src/app/core/services/patient.service';
import { MatchingService } from 'src/app/core/services/matching.service';
import { HttpClient } from '@angular/common/http';

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

  private apiUrl = 'http://localhost:8080/api/patients';

  constructor(
    private router: Router,
    private configService: ConfigService,
    private patientService: PatientService,
    private matchingService: MatchingService,
    private HttpClient: HttpClient
  ) { }

  ngOnInit(): void {
    this.configService.whatsappNumber$.subscribe(num => {
      this.whatsappLink = `https://wa.me/${num}`;
    });


    // 2. Carga de Paciente y Escucha de Notificaciones Reales
    this.patientService.patients$.subscribe(patients => {
      const p = patients.find(patient => patient.id === this.currentPatientId);
      if (p) {
        this.patientData = {
          ...p,
          insurance: p.healthInsurance,
          location: p.locationLink,
          caregiver: {
            name: 'Buscando...',
            specialty: '-'
          }
        };

        // Escuchamos el MatchingService AQUÍ ADENTRO para asegurar que patientData existe
        this.matchingService.posts$.subscribe(posts => {

          console.log('Posts totales en el servicio:', posts);
          console.log('Buscando para el paciente:', this.patientData.name);

          const confirmedService = posts.find(post => {
            const matchNombre = post.patientName?.trim().toLowerCase() === this.patientData.name?.trim().toLowerCase();
            const matchStatus = post.status === 'Publicado';
            console.log(`Revisando post de ${post.patientName}: NombreMatch=${matchNombre}, Status=${post.status}`);
            return matchNombre && matchStatus;
          });

          if (confirmedService) {
            console.log('✅ ¡MATCH ENCONTRADO!', confirmedService);
            this.handleNewMatchNotification(confirmedService);
          } else {
            console.log('❌ No se encontró ningún match confirmado para este paciente todavía.');
          }
        });
      }
    });
  }

  private handleNewMatchNotification(service: any) {
    const exists = this.notifications.some(n => n.id === service.id);

    if (!exists) {

      const nombreCuidador = service.caregiverName || 'Lara Martínez';

      const newNotif = {
        id: service.id,
        title: '¡Cuidador Asignado!',
        message: `${nombreCuidador} ha sido confirmada para cuidar a ${service.patientName} en zona ${service.zone}.`,
        date: new Date(),
        read: false
      };

      this.notifications = [newNotif, ...this.notifications];
      this.unreadCount++;

      if (this.patientData) {
        this.patientData.caregiver = {
          name: nombreCuidador,
          specialty: service.specialty || 'Especialista en Gerontología'
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