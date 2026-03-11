import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AdminRegisterComponent } from './components/admin-register/admin-register.component';
import { FormsModule } from '@angular/forms';

@NgModule({
    declarations: [
        HeaderComponent,
        LoginComponent,
        RegisterComponent,
        AdminRegisterComponent
    ],
    imports: [
        CommonModule,
        RouterModule,
        FormsModule
    ],
    exports: [
        HeaderComponent,
        LoginComponent,
        RegisterComponent
    ]
})
export class CoreModule { }
