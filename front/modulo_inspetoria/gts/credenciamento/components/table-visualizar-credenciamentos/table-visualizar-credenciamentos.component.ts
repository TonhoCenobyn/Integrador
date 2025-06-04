import { Component, OnInit } from "@angular/core";
import {ProcessoDTO} from '../../../../../../../app-core/dto/processos/processo-dto';
import {Usuario} from '../../../../../../../app-core/model/usuario.model';
import {LoginService} from '../../../../../../../app-core/service/login.service';
import {CredenciamentoService} from '../../../../../../../app-core/service/gts/credenciamento/credenciamento.service';
import {
   SolicitacaoCredenciamentoDTO
} from '../../../../../../../modulo-cidadao/components/modules/gts/credenciamento/dto/solicitacao-credenciamento.dto';
import {CredenciamentoGtsUtils} from '../../../../../../../app-core/utils/credenciamento-gts-utils';
import {StatusTramitacao} from '../../../../../../../app-core/dto/gts/credenciamento/tramitacao-dto';
import {CodigoDescricao} from '../../../../../../../app-core/model/gts/codigo-descricao';
import {map} from 'rxjs/operators';

@Component({
   selector: "table-visualizar-credenciamentos",
   templateUrl: "table-visualizar-credenciamentos.component.html",
})
export class TableVisualizarCredenciamentosComponent implements OnInit {
   usuarioLogado: Usuario;
   processosTramitados: ProcessoDTO[];
   solicitacoes: SolicitacaoCredenciamentoDTO[] = [];
   loading: boolean;
   constructor(
      private credenciamentoService: CredenciamentoService,
      private loginService: LoginService,
      ) { }


   ngOnInit() {
      this.usuarioLogado = this.loginService.getUsuarioLogado();

      this.credenciamentoService.findAllTramitados(this.usuarioLogado.unidadeLogado.idUnidadeInspecao).pipe(
         map((processos: ProcessoDTO[]) =>
            processos.filter(p => p.tipoProcesso === 'CREDENCIAMENTO_CIDADAO_GTS' && !p.finalizado)
         )
      ).subscribe(
         (processos: ProcessoDTO[]) => {

            if (processos != null) {
               processos.forEach(processo => {
                  const solicitacao: SolicitacaoCredenciamentoDTO = new SolicitacaoCredenciamentoDTO();
                  solicitacao.numero_processo = processo.numeroProcesso;
                  solicitacao.uuid = processo.uuid;
                  solicitacao.data_solicitacao = processo.criadoEm;

                  const despacho = CredenciamentoGtsUtils.getUltimaTramitacao(processo);

                  if (despacho.tramitacao.statusTramitacao.codigo.includes(StatusTramitacao.APROVADO)) {
                     solicitacao.status = "APROVADO"
                  } else if (despacho.tramitacao.statusTramitacao.codigo.includes(StatusTramitacao.RETORNADO_PARA_CORRECAO)) {
                     solicitacao.status = "REPROVADO";
                  } else {
                     solicitacao.status = "AGUARDANDO REVISÃO";
                  }
                  solicitacao.data_tramitacao = despacho.criadoEm;
                  solicitacao.estabelecimento = CredenciamentoGtsUtils.getUltimoDespacho(processo, CodigoDescricao.DADOS_PREENCHIMENTO).inclusao.metadados['nome_fantasia'];
                  solicitacao.usuario = CredenciamentoGtsUtils.getUltimoDespacho(processo, CodigoDescricao.DADOS_PREENCHIMENTO).inclusao.metadados['nome_profissional'];
                  this.solicitacoes.push(solicitacao);
               });
            }
         }
      );
   }
}
