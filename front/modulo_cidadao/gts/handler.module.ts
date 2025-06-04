import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, ROUTES } from "@angular/router";
import { LoginService } from "src/app/app-core/service/login.service";
import { GtsService } from "./gts.service";

@NgModule({
   declarations: [],
   imports: [CommonModule, RouterModule],
   providers: [
      {
         provide: ROUTES,
         useFactory: configHandlerRoutes,
         deps: [LoginService, GtsService],
         multi: true,
      },
   ],
})
export class HandlerModule {}

export function configHandlerRoutes(
   loginService: LoginService,
   gtsService: GtsService
) {
   const usuarioLogado = loginService.getUsuarioLogado();

   if (!usuarioLogado.permissoes) {
      loginService.redirectLogin("/login");

      return;
   }

   const vinculos = gtsService.vinculos.getValue();

   const routes = [];
      routes.push(
         ...[
            {
               path: "",
               redirectTo: "credenciamento"
            },
            {
               path: "credenciamento",
               loadChildren: () =>
                  import('./credenciamento/credenciamento.module')
                     .then((mod) => mod.CredenciamentoModule),
            }
         ]
      );
      return routes;
}
