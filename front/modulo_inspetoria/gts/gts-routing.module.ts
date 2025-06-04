import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import {
   TableVisualizarCredenciamentosComponent
} from './credenciamento/table-visualizar-credenciamentos/table-visualizar-credenciamentos.component';
import {
   FormAnalisarCredenciamentoComponent
} from './credenciamento/form-analisar-credenciamento/form-analisar-credenciamento.component';

export const routes: Routes = [
   {
      path: "",
      component: TableVisualizarCredenciamentosComponent,
   },
   {
      path: "analisar/:processo-uuid",
      component: FormAnalisarCredenciamentoComponent
   }
];
@NgModule({
   imports: [RouterModule.forChild(routes)],
   exports: [RouterModule],
})
export class GtsRoutingModule {}
