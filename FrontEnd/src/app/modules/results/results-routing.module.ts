import { userResolver } from './../../core/resolvers/user.resolver';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ResultsComponent } from './results.component';

const routes: Routes = [{ path: '', component: ResultsComponent, resolve: { user: userResolver }}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResultsRoutingModule { }
