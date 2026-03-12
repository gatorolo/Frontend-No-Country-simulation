import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './core/components/login/login.component';
import { RegisterComponent } from './core/components/register/register.component';
import { AdminRegisterComponent } from './core/components/admin-register/admin-register.component';
import { ForgotPasswordComponent } from './core/components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './core/components/reset-password/reset-password.component';
import { MaintenanceGuard } from './core/guards/maintenance.guard';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'admin-register', component: AdminRegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
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
