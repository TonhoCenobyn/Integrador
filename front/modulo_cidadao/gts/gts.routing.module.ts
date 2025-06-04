import { NgModule } from "@angular/core";
import { GtsComponent } from "./gts.component";
import { Routes, RouterModule } from "@angular/router";

export const routes: Routes = [
   {
      path: "",
      component: GtsComponent,
   },
   {
      path: "home",
      loadChildren: () =>
         import("./handler.module").then((m) => m.HandlerModule),
   },
];
@NgModule({
   imports: [RouterModule.forChild(routes)],
   exports: [RouterModule],
})
export class GtsRoutingModule {}
