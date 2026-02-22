import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FamilyComponent } from './family.component';
import { FamilyViewComponent } from './family-view.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

const routes: Routes = [
  { path: '', component: FamilyComponent },
  { path: 'view', component: FamilyViewComponent },
  { path: 'view/:id', component: FamilyViewComponent },
  { path: ':id', component: FamilyComponent }
];

@NgModule({
  declarations: [
    FamilyComponent,
    FamilyViewComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    FormsModule
  ]
})
export class FamilyModule { }
