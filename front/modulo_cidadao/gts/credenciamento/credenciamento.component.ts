import { Component, OnInit } from '@angular/core';
import {Usuario} from '../../../../../app-core/model/usuario.model';
import {LoginService} from '../../../../../app-core/service/login.service';

@Component({
   selector: 'app-credenciamento',
   templateUrl: './credenciamento.component.html',
   styleUrls: ['./credenciamento.component.scss']
})
export class CredenciamentoComponent implements OnInit {
   usuarioLogado: Usuario = this.loginService.getUsuarioLogado();


   constructor(
      private loginService: LoginService,
   ) {}

   ngOnInit(): void {}
}
