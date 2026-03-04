import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Components
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminSidebarComponent } from './components/sidebar/admin-sidebar.component';
import { AdminTopbarComponent } from './components/topbar/admin-topbar.component';
import { AdminComponent } from './admin.component'; // Dashboard
import { PublishServiceComponent } from './components/publish-service/publish-service.component';
// Pages
import { CaregiversComponent } from './pages/caregivers.component';
import { PatientsComponent } from './pages/patients.component';
import { PaymentsComponent } from './pages/payments.component';
import { DocumentsComponent } from './pages/documents.component';
import { ReportsComponent } from './pages/reports.component';
import { SettingsComponent } from './pages/settings.component';
import { ConfigComponent } from './pages/config.component';
import { GeneralComponent } from './pages/configuracionComponent/general/general.component';
import { SeguridadComponent } from './pages/configuracionComponent/seguridad/seguridad.component';
import { NotificacionesComponent } from './pages/configuracionComponent/notificaciones/notificaciones.component';
import { AparienciaComponent } from './pages/configuracionComponent/apariencia/apariencia.component';
import { SistemaComponent } from './pages/configuracionComponent/sistema/sistema.component';
import { CoreModule } from "src/app/core/core.module";

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminComponent },
      { path: 'dashboard', component: AdminComponent },
      { path: 'caregivers', component: CaregiversComponent },
      { path: 'patients', component: PatientsComponent },
      { path: 'payments', component: PaymentsComponent },
      { path: 'documents', component: DocumentsComponent },
      { path: 'reports', component: ReportsComponent },
      {
        path: 'settings',
        component: SettingsComponent,
        children: [
          { path: 'general', component: GeneralComponent },
          { path: 'seguridad', component: SeguridadComponent },
          { path: 'notificaciones', component: NotificacionesComponent },
          { path: 'apariencia', component: AparienciaComponent },
          { path: 'sistema', component: SistemaComponent }
        ]
      },
      { path: 'config', component: ConfigComponent }
    ]
  }
];

@NgModule({
  declarations: [
    AdminLayoutComponent,
    AdminSidebarComponent,
    AdminTopbarComponent,
    AdminComponent,
    CaregiversComponent,
    PatientsComponent,
    PaymentsComponent,
    DocumentsComponent,
    ReportsComponent,
    SettingsComponent,
    ConfigComponent,
    GeneralComponent,
    SeguridadComponent,
    NotificacionesComponent,
    AparienciaComponent,
    SistemaComponent,
    PublishServiceComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    CoreModule
  ]
})
export class AdminModule { }
