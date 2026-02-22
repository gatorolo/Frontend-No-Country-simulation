import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './core/components/login/login.component';
import { MaintenanceGuard } from './core/guards/maintenance.guard';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 'caregiver',
    loadChildren: () => import('./features/caregiver/caregiver.module').then(m => m.CaregiverModule),
    canActivate: [MaintenanceGuard]
  },
  {
    path: 'family',
    loadChildren: () => import('./features/family/family.module').then(m => m.FamilyModule),
    canActivate: [MaintenanceGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
