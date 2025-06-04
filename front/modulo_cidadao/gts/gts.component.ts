import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { EmpresaDTO } from "src/app/app-core/dto/empresa-dto";
import { LoginService } from "src/app/app-core/service/login.service";
import { GtsService } from "./gts.service";
import { MenuLateralService } from "../../utils/menu-lateral/menu-lateral.service";
import {EmpresaService} from '../../../../app-core/service/empresa.service';

@Component({
   selector: "cidadao-gts-home",
   templateUrl: "gts.component.html"
})
export class GtsComponent implements OnInit {
   constructor(
      private router: Router,
      private route: ActivatedRoute,
      private loginService: LoginService,
      private menuLateralService: MenuLateralService,
      public gtsService: GtsService,
      public empresaService: EmpresaService
   ) {}

   ngOnInit() {
      this.menuLateralService.setItems([
         {
            title: "Página inicial",
            icon: "flaticon2-architecture-and-city",
            route: `/principal`,
         },
      ]);

      this.gtsService.loadVinculos().then((dto) => {
         this.empresaService.getVinculosUsuarioEmpresas(dto.id).subscribe(vinculos => {
            const vinculosConvertidos = vinculos.map((v: any) => ({
               ...v,
               empresaId: v.empresa?.id,
               usuarioId: v.usuario?.id
            }));
            dto.empresas.forEach(empresa => {
               vinculosConvertidos.forEach(vinculo => {
                  if (vinculo.empresaId === empresa.id && vinculo.ativo) {
                     empresa.vinculoAtivo = true;
                  }
               });
            });
            const empresas = dto.empresas;

            dto.empresas = empresas.filter((empresa) => empresa.tipoEmpresa === 'AGROINDUSTRIA' && empresa.vinculoAtivo === true);

            this.gtsService.vinculos.next(dto);
         });
      });
   }

   onSelectVinculo(event: EmpresaDTO) {
      if (!this.loginService.gotoRedirect() || !this.loginService.checkRedirect("gts")) {
         this.router.navigate([`./home`], {
            relativeTo: this.route,
         });
      }
   }
}
