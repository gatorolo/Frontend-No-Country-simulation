import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigService } from 'src/app/core/services/config.service';
import { PatientService } from 'src/app/core/services/patient.service';
import { MatchingService } from 'src/app/core/services/matching.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { CaregiverService } from 'src/app/core/services/caregiver.service';
import { tap } from 'rxjs/operators';
import Swal from 'sweetalert2';

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
  isLoading = true;
  errorMessage = '';
  private pendingCaregiver: any = null;
  activeOrderId: number | null = null;
  totalDebt: number = 0;
  unpaidShiftIds: number[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private configService: ConfigService,
    private patientService: PatientService,
    private matchingService: MatchingService,
    private notificationService: NotificationService,
    private caregiverService: CaregiverService
  ) { }

  ngOnInit(): void {
    // 1. WhatsApp Link
    this.configService.config$.subscribe(config => {
      this.whatsappLink = `https://wa.me/${config.general.whatsappNumber}`;
      this.checkMatchingForPatient();
    });

    // 2. Escuchar el ID de la URL y Cargar Datos de forma robusta
    this.route.paramMap.pipe(
      tap(params => {
        this.isLoading = true;
        this.errorMessage = '';
        const idParam = params.get('id');
        if (idParam) {
          this.currentPatientId = Number(idParam);
          this.fetchPatientData(this.currentPatientId);
        } else {
          // Fallback si no hay ID en la URL
          this.patientService.getPatientsFromApi().subscribe({
            next: (patients) => {
              if (patients && patients.length > 0) {
                // Buscamos el último o el que coincida con el current
                const p = patients.find(patient => (patient as any).id === this.currentPatientId) || patients[patients.length - 1];
                if (p) {
                  this.initializePatientData(p);
                  this.isLoading = false;
                } else {
                  this.isLoading = false;
                  this.errorMessage = 'No se encontró el paciente solicitado.';
                }
              } else {
                this.isLoading = false;
                this.errorMessage = 'No hay pacientes registrados en el sistema.';
              }
            },
            error: (err) => {
              this.isLoading = false;
              this.errorMessage = 'Error de conexión con el servidor.';
            }
          });
        }
      })
    ).subscribe();

    // UI Sync Fix:
    // - Corregir nombre "undefined" en notificaciones de familia
    // - Reflejar info de notificación en `caregiver-info` (Especialidad, etc)
    // - Verify the UI updates correctly
    // 3. Suscripción a Notificaciones Reales
    this.notificationService.notifications$.subscribe(notifs => {
      const familyNotifs = notifs.filter(n => n.recipientRole === 'family');

      // Si hay más notificaciones de las que teníamos antes, hay algo nuevo
      if (familyNotifs.length > this.notifications.length) {
        const latest: any = familyNotifs[0]; // Tomamos la última

        if (latest && latest.caregiverName) {
          console.log('📢 Nueva notificación: Asignando a', latest.caregiverName);

          // Actualizamos la propiedad que el HTML usa en el *ngIf
          if (this.patientData) {
            this.patientData.caregiverName = latest.caregiverName;
            this.patientData.caregiverSpecialty = latest.caregiverSpecialty;

            this.patientData.caregiver = {
              fullName: latest.caregiverName,
              specialty: latest.caregiverSpecialty || 'Acompañante Terapéutico Asignado',
              isVerified: true
            };
          }
        }

        // Actualizamos el contador de no leídas
        this.unreadCount += (familyNotifs.length - this.notifications.length);
      }

      this.notifications = familyNotifs;
    });
  }

  fetchPatientData(id: number) {
    this.isLoading = true;
    this.patientService.getPatientById(id).subscribe({
      next: (data) => {
        // 1. Usamos el inicializador (esto arregla el mapeo de campos)
        this.initializePatientData(data);
        this.isLoading = false;

        // 2. Sincronizamos con las órdenes activas para ver si hay cuidador
        this.syncWithActiveOrders();

        // 3. Consultamos la deuda pendiente
        const pName = (data as any)['name'] || (data as any)['patientName'] || 'Paciente';
        this.fetchPatientDebt(pName);
      },
      error: (err) => {
        console.error('Error al cargar paciente:', err);
        this.tryFallback(id);
      }
    });
  }

  private initializePatientData(data: any) {
    this.patientData = {
      ...data,
      // Aseguramos que 'name' exista para que el .trim() no falle luego
      name: data.name || data.patientName || 'Paciente',
      age: data.age || data.patientAge || '-',
      insurance: data.healthInsurance || data.insurance || '-',
      location: data.locationLink || data.location,
      medications: data.medications || [],
      // Inicializamos caregiverName en null para que el HTML muestre "Buscando..."
      caregiverName: null,
      caregiverSpecialty: null
    };
  }

  private syncWithActiveOrders() {
    this.matchingService.getActiveOrders().subscribe(orders => {
      if (!this.patientData || !orders) return;

      const pName = (this.patientData.name || '').trim().toLowerCase();

      const myOrder = orders.find(order => {
        const oName = (order.patientName || '').trim().toLowerCase();
        // Match: El nombre coincide Y el estado es Confirmado
        return (pName.includes(oName) || oName.includes(pName)) && order.status === 'Confirmado';
      });

      if (myOrder) {
        this.activeOrderId = myOrder.id;
        // Seteamos AMBAS propiedades para que cualquier parte del HTML lo vea
        this.patientData.caregiverName = myOrder.caregiverName;
        this.patientData.caregiverSpecialty = myOrder.specialty || 'Acompañante Especiliazado';
        this.patientData.caregiver = {
          fullName: myOrder.caregiverName,
          specialty: myOrder.specialty || 'Especialista Asignado',
          isVerified: true
        };
      } else {
        this.activeOrderId = null;
      }
    });
  }
  /*private syncWithActiveOrders() {
    this.matchingService.getActiveOrders().subscribe({
      next: (orders) => {
        if (!this.patientData) return;
        const pName = (this.patientData.name || '').trim().toLowerCase();
        const myOrder = orders.find(order => {
          const oName = (order.patientName || '').trim().toLowerCase();
          return (pName.includes(oName) || oName.includes(pName)) && order.status === 'Confirmado';
        });
        if (myOrder) {
          this.patientData.caregiverName = myOrder.caregiverName;
        }
      }
    });
  }*/

  private fetchPatientDebt(patientName: string) {
    if (!patientName) return;
    this.caregiverService.getUnpaidShiftsByPatientName(patientName).subscribe({
      next: (shifts) => {
        // Acumulamos la deuda total y los IDs de las guardias
        this.totalDebt = shifts.reduce((sum, shift) => sum + (shift.earned || 0), 0);
        this.unpaidShiftIds = shifts.map(shift => shift.id).filter(id => id !== undefined);
      },
      error: (err) => console.error('Error al cargar la deuda del paciente:', err)
    });
  }

  private tryFallback(requestedId: number) {
    this.patientService.getPatientsFromApi().subscribe({
      next: (patients) => {
        if (patients && patients.length > 0) {
          // Si el ID pedido no existe, mostramos el primero disponible para evitar pantalla en blanco
          const p = patients[0];
          console.log(`⚠️ ID ${requestedId} no encontrado. Mostrando fallback: ${p.id}`);
          this.initializePatientData(p);
          this.isLoading = false;
        } else {
          this.isLoading = false;
          this.errorMessage = 'No se encontraron pacientes disponibles.';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Error al intentar recuperar la lista de pacientes.';
      }
    });
  }

  private syncCaregiverById(postId: number) {
    const posts = this.matchingService.getPosts();
    const post = posts.find(p => p.id === postId);
    if (post && post.status === 'Confirmado') {
      this.updateCaregiverInfo(post);
    }
  }

  private checkMatchingForPatient() {
    this.matchingService.posts$.subscribe(posts => {
      if (!this.patientData || !posts) return;

      // Buscamos un servicio que esté 'Confirmado' para este paciente
      // Mejoramos el matching: buscamos coincidencia de nombre o que esté asignado específicamente
      const confirmedService = posts.find(post => {
        const patientName = this.patientData.name || this.patientData.patientName;
        const matchNombre = post.patientName?.trim().toLowerCase() === patientName?.trim().toLowerCase();
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
        specialty: service.specialty || 'Especialista en Gerontología',
        isVerified: service.status === 'Confirmado'
      };
    }
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      // Marcamos todas las de familia como leídas al abrir el panel
      this.notifications.forEach(n => {
        if (!n.read) {
          this.notificationService.markAsRead(n.id);
        }
      });
      this.unreadCount = 0;
    }
  }

  removeNotification(event: Event, id: number) {
    event.stopPropagation(); // Evita que se cierre el dropdown
    this.notificationService.removeNotification(id);
  }

  clearNotifications() {
    this.notificationService.clearByRole('family');
    this.showNotifications = false;
  }

  dismissCaregiver() {
    if (!this.activeOrderId) return;

    import('sweetalert2').then(Swal => {
      Swal.default.fire({
        title: '¿Finalizar asignación?',
        text: 'El cuidador ya no aparecerá como asignado a este paciente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0ea5e9',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Sí, finalizar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.matchingService.deletePost(this.activeOrderId!).subscribe({
            next: () => {
              this.activeOrderId = null;
              if (this.patientData) {
                this.patientData.caregiverName = null;
                this.patientData.caregiver = null;
              }
              Swal.default.fire('¡Finalizado!', 'La asignación ha sido eliminada.', 'success');
            },
            error: (err) => {
              console.error('Error al eliminar asignación:', err);
              Swal.default.fire('Error', 'No se pudo eliminar la asignación.', 'error');
            }
          });
        }
      });
    });
  }

  onEdit() {
    if (this.patientData && this.patientData['id']) {
      this.router.navigate(['/family', this.patientData['id']]);
    } else {
      this.router.navigate(['/family']);
    }
  }

  getDebtColorClass(): string {
    if (this.totalDebt === 0) {
      return 'debt-green'; // Sin cargos
    } else if (this.totalDebt >= 200000 && this.totalDebt <= 500000) {
      return 'debt-orange'; // Naranja
    } else if (this.totalDebt > 500000) {
      return 'debt-red'; // Rojo
    } else {
      return 'debt-default'; // Entre 1 y 199.999 ARS
    }
  }

  payDebt() {
    if (this.unpaidShiftIds.length === 0) return;

    Swal.fire({
      title: '¿Proceder al pago?',
      text: 'Se redirigirá al sistema de pago para saldar la deuda pendiente.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Sí, Pagar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        // En el futuro, aquí se lanza MercadoPago. Por ahora simulamos éxito pagando por la API.
        const paymentRequests = this.unpaidShiftIds.map(id => this.caregiverService.payPatientShift(id));

        import('rxjs').then(({ forkJoin }) => {
          forkJoin(paymentRequests).subscribe({
            next: () => {
              Swal.fire('¡Pago Exitoso!', 'La cuenta regresó a $0.', 'success');
              // Refrescar deuda
              const pName = this.patientData.name || this.patientData['patientName'] || 'Paciente';
              this.fetchPatientDebt(pName);
            },
            error: (err) => {
              console.error('Error procesando pago:', err);
              Swal.fire('Error', 'No se pudo procesar el pago.', 'error');
            }
          });
        });
      }
    });
  }

  onLogout() {
    this.router.navigate(['/login']);
  }

  onCreateNew() {
    this.router.navigate(['/family']);
  }

  getMapsLink(address: string): string {
    if (!address) return '#';
    // Si ya es un enlace web, lo retornamos tal cual
    if (address.startsWith('http://') || address.startsWith('https://')) {
      return address;
    }
    // Convertimos la dirección real a una URL de búsqueda de Google Maps
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
}

