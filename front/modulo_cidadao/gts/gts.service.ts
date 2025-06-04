import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { UsuarioEmpresaDTO } from "src/app/app-core/dto/usuario-empresa-dto";
import { EmpresaService } from "src/app/app-core/service/empresa.service";
import { LoginService } from "src/app/app-core/service/login.service";

@Injectable()
export class GtsService {
   vinculos = new BehaviorSubject<UsuarioEmpresaDTO>(null);

   constructor(
       private loginService: LoginService,
       private empresaService: EmpresaService
   ) {}

   async loadVinculos() {
       const usuarioLogado = this.loginService.getUsuarioLogado();

       const dto = await this.empresaService
           .getUsuarioEmpresaByUuid(usuarioLogado.uuid)
           .toPromise();
       return dto;
   }
}
