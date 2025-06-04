import { NgModule } from "@angular/core";
import {CommonModule} from '@angular/common';
import {NgSelectModule} from '@ng-select/ng-select';
import {NguiMapModule} from '@ngui/map';
import {NgxMaskModule} from 'ngx-mask';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedUtilsModule} from '../../../../../app-core/utils/shared-utils.module';
import {
   TableVisualizarCredenciamentosComponent
} from './credenciamento/table-visualizar-credenciamentos/table-visualizar-credenciamentos.component';
import {GtsRoutingModule} from './gts-routing.module';
import {SharedModule} from 'primeng/api';
import {
   FormAnalisarCredenciamentoComponent
} from './credenciamento/form-analisar-credenciamento/form-analisar-credenciamento.component';
import {GenericModalComponent} from './credenciamento/modals/generic-modal/generic-modal.component';

@NgModule({
   declarations: [
      TableVisualizarCredenciamentosComponent,
      FormAnalisarCredenciamentoComponent,
      GenericModalComponent,
   ],
    imports: [
        CommonModule,
        FormsModule,
        GtsRoutingModule,
        SharedModule,
        NgSelectModule,
        NguiMapModule,
        NgxMaskModule,
        ReactiveFormsModule,
        SharedUtilsModule,
    ],
   exports: [],
})
export class GtsModule {}
