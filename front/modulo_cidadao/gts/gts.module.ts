import { NgModule } from "@angular/core";
import { GtsComponent } from "./gts.component";
import { GtsRoutingModule } from "./gts.routing.module";
import { GtsService } from "./gts.service";
import { SharedModule } from "../../shared/shared.module";
import { MenuLateralService } from "../../utils/menu-lateral/menu-lateral.service";

@NgModule({
   declarations: [GtsComponent],
   imports: [GtsRoutingModule, SharedModule],
   exports: [],
   providers: [GtsService]
})
export class GtsModule {}
