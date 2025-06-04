import { NgModule } from "@angular/core";
import { GtsRoutingModule } from "../gts.routing.module";
import { GtsService } from "../gts.service";
import { SharedModule } from "../../../shared/shared.module";
import {CredenciamentoComponent} from './credenciamento.component';
import {CommonModule} from '@angular/common';
import {CredenciamentoRoutingModule} from './credenciamento.routing.module';
import {MenuLateralService} from '../../../utils/menu-lateral/menu-lateral.service';
import {NgSelectModule} from '@ng-select/ng-select';
import {NguiMapModule} from '@ngui/map';
import {NgxMaskModule} from 'ngx-mask';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedUtilsModule} from '../../../../../app-core/utils/shared-utils.module';
import {FormCredenciamentoComponent} from './components/form/form-credenciamento.component';
import {TableCredenciamentosComponent} from './components/table/table-credenciamentos.component';
import {GenericModalComponent} from './generic-modal/generic-modal.component';

@NgModule({
   declarations: [
      CredenciamentoComponent,
      FormCredenciamentoComponent,
      TableCredenciamentosComponent,
      GenericModalComponent
   ],
   imports: [
      CommonModule,
      CredenciamentoRoutingModule,
      GtsRoutingModule,
      SharedModule,
      NgSelectModule,
      NguiMapModule,
      NgxMaskModule,
      ReactiveFormsModule,
      FormsModule,
      SharedUtilsModule
   ],
   exports: [],
   providers: [GtsService]
})
export class CredenciamentoModule {
   constructor(private menuLateralService: MenuLateralService) {
      this.menuLateralService.setItems([
         {
            title: "Página inicial",
            icon: "flaticon2-architecture-and-city",
            route: `/principal/gts/home`,
            exact: true
         },
         /*{
            title: "GTS",
            collapsible: false,
            routes: [
               {
                  title: "Histórico",
                  icon: "fas fa-history",
                  route: `/principal/gts/home`
               },
               {
                  title: "Emitir GTS",
                  icon: "fas fa-file-alt",
                  route: `/principal/gts/home/nova`
               }
            ],
         },*/
         {
            title: "Credenciamento",
            collapsible: true,
            routes: [
               {
                  title: "Novo Credenciamento",
                  icon: "fas fa-history",
                  route: `/principal/gts/home/credenciamento`
               },
               {
                  title: "Visualizar Credenciamentos",
                  icon: "fas fa-file-alt",
                  route: `/principal/gts/home/credenciamento/visualizar`
               }
            ],
         },
      ]);
   }
}
