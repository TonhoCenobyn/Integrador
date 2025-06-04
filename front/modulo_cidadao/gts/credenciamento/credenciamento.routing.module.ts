import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {FormCredenciamentoComponent} from './components/form/form-credenciamento.component';
import {TableCredenciamentosComponent} from './components/table/table-credenciamentos.component';

export const routes: Routes = [
   {
      path: "",
      component: FormCredenciamentoComponent,
      data: { isCorrecao: false }
   },
   {
      path: "visualizar",
      component: TableCredenciamentosComponent
   },
   {
      path: "ajustar/:processo-uuid",
      component: FormCredenciamentoComponent,
      data: { isCorrecao: true }
   }
]
@NgModule({
   imports: [RouterModule.forChild(routes)],
   exports: [RouterModule],
})
export class CredenciamentoRoutingModule {}
