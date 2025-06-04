import {Component, OnInit} from '@angular/core';
import {Usuario} from '../../../../../../../app-core/model/usuario.model';
import {CredenciamentoService} from '../../../../../../../app-core/service/gts/credenciamento/credenciamento.service';
import {LoginService} from '../../../../../../../app-core/service/login.service';
import {ProcessoDTO} from '../../../../../../../app-core/dto/processos/processo-dto';
import {CredenciamentoGtsUtils} from '../../../../../../../app-core/utils/credenciamento-gts-utils';
import {Router} from '@angular/router';
import {DespachoDTO} from '../../../../../../../app-core/dto/processos/despacho-dto';
import {StatusTramitacao} from '../../../../../../../app-core/dto/gts/credenciamento/tramitacao-dto';
import {SolicitacaoCredenciamentoDTO} from '../../dto/solicitacao-credenciamento.dto';
import {CodigoDescricao} from '../../../../../../../app-core/model/gts/codigo-descricao';
import {CredenciamentoComponent} from '../../credenciamento.component';

@Component({
   selector: 'app-table-credenciamentos',
   templateUrl: './table-credenciamentos.component.html',
   styleUrls: ['./table-credenciamentos.component.scss']
})
export class TableCredenciamentosComponent implements OnInit {
   solicitacoes: SolicitacaoCredenciamentoDTO[] = [];
   processo: ProcessoDTO;
   despacho: DespachoDTO;
   usuario: Usuario;
   correcoes: string[];
   sendingRequest: boolean;

   constructor(
      public credenciamentoService: CredenciamentoService,
      public loginService: LoginService,
      private router: Router,
   ) {}

   ngOnInit(): void {
      this.usuario = this.loginService.getUsuarioLogado();
      let solicitacao: SolicitacaoCredenciamentoDTO = new SolicitacaoCredenciamentoDTO();

      this.credenciamentoService.findAllByUsuarioLogado().subscribe(data => {
         if (data != null){
            data.forEach(processo => {
               solicitacao.numero_processo = processo.numeroProcesso;
               solicitacao.uuid = processo.uuid;
               solicitacao.data_solicitacao = processo.criadoEm;

               this.despacho = CredenciamentoGtsUtils.getUltimaTramitacao(processo);

               if (this.despacho.tramitacao.statusTramitacao.codigo.includes(StatusTramitacao.APROVADO)) {
                  solicitacao.status = "APROVADO"
               } else if (this.despacho.tramitacao.statusTramitacao.codigo.includes(StatusTramitacao.RETORNADO_PARA_CORRECAO)) {
                  solicitacao.status = "REPROVADO";
               } else {
                  solicitacao.status = "AGUARDANDO REVISÃO";
               }

               solicitacao.estabelecimento = CredenciamentoGtsUtils.getUltimoDespacho(processo, CodigoDescricao.DADOS_PREENCHIMENTO).inclusao.metadados['nome_fantasia'];

               this.solicitacoes.push(solicitacao);
            });
         }
      });
   }

   async apresentarJustificativa(uuid: string) {
      this.processo = await this.credenciamentoService.getProcesso(uuid).toPromise();

      this.correcoes =  CredenciamentoGtsUtils.getUltimoDespachoParecer(this.processo).inclusao.metadados['correcao'];

      const modalElement = document.getElementById('solicitar-revisao');

      if (modalElement) {
         const modal = new (window as any).bootstrap.Modal(modalElement);
         modal.show();
      }
   }

   ajustarForm() {
      this.router.navigate(["/principal/gts/home/credenciamento/ajustar/" + this.processo.uuid]);
   }
}

