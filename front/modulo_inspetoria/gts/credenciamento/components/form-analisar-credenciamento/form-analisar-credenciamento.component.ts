import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CredenciamentoService} from '../../../../../../../app-core/service/gts/credenciamento/credenciamento.service';
import {CodigoDescricao} from '../../../../../../../app-core/model/gts/codigo-descricao';
import {StatusTramitacao} from '../../../../../../../app-core/dto/gts/credenciamento/tramitacao-dto';
import {ProcessoDTO} from '../../../../../../../app-core/dto/processos/processo-dto';
import {DespachoDTO} from '../../../../../../../app-core/dto/processos/despacho-dto';
import {PreenchimentoDTO} from '../../../../../../../app-core/dto/gts/credenciamento/preenchimento-dto';
import {CredenciamentoGtsUtils} from '../../../../../../../app-core/utils/credenciamento-gts-utils';
import {
   ParecerDTO,
   StatusParecerDTO
} from '../../../../../../../app-core/dto/gts/credenciamento/parecer-credenciamento-dto';
import Swal from 'sweetalert2';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

declare var $: any;

@Component({
   selector: "form-analisar-credenciamento",
   templateUrl: "form-analisar-credenciamento.component.html",
})
export class FormAnalisarCredenciamentoComponent implements OnInit {
   itemList = [];

   processo: ProcessoDTO;
   despacho: DespachoDTO;
   parecer: ParecerDTO;

   isRetorno: boolean = false;
   isLoading: boolean = true;
   sendingRequest: boolean = false;

   formPreenchimento: FormGroup;
   formRevisao: FormGroup;

   uuidProcesso: string = this.route.snapshot.paramMap.get('processo-uuid')!;
   uuidDespachoDadosPreenchimento: string;

   motivosRevisao: string[] = [];
   ultimoDespachoParecer: DespachoDTO;
   preenchimento: PreenchimentoDTO = new PreenchimentoDTO();

   constructor(
      private route: ActivatedRoute,
      private credenciamentoService: CredenciamentoService,
      private router: Router,
      private fb: FormBuilder
   ) {}

   ngOnInit() {
      this.formPreenchimento = this.fb.group({
         nomeProfissional: [{ value: '', disabled: true }, [Validators.required]],
         cpfProfissional: [{ value: '', disabled: true }, [Validators.required]],
         telefoneProfissional: [{ value: '', disabled: true }, [Validators.required]],
         emailProfissional: [{ value: '', disabled: true }, [Validators.required]],
         formacao: [{ value: '', disabled: true }, [Validators.required]],
         crmvProfissional: [{ value: '', disabled: true }, [Validators.required]],
         nomeFantasia: [{ value: '', disabled: true }, [Validators.required]],
         razaoSocial: [{ value: '', disabled: true }, [Validators.required]],
         cnpj: [{ value: '', disabled: true }, [Validators.required]],
         inscricaoEstadual: [{ value: '', disabled: true }, [Validators.required]],
         telefone: [{ value: '', disabled: true }, [Validators.required]],
         celular: [{ value: '', disabled: true }, [Validators.required]],
         email: [{ value: '', disabled: true }, [Validators.required]],
         crmv: [{ value: '', disabled: true }, [Validators.required]],
         cepContratante: [{ value: '', disabled: true }, [Validators.required]],
         logradouroContratante: [{ value: '', disabled: true }, [Validators.required]],
         numeroContratante: [{ value: '', disabled: true }, [Validators.required]],
         complementoContratante: [{ value: '', disabled: true }, [Validators.required]],
         municipioContratante: [{ value: '', disabled: true }, [Validators.required]],
         ufContratante: [{ value: '', disabled: true }, [Validators.required]],
      });

      this.setPreenchimento();

      this.formRevisao = this.fb.group({
         motivoRevisao: ['']
      });
   }

   async setPreenchimento() {
      this.isLoading = true;
      this.processo = await this.credenciamentoService.getProcesso(this.uuidProcesso).toPromise();
      this.setUuidDespachos();

      this.despacho = await this.credenciamentoService
         .getDespacho(this.uuidProcesso, this.uuidDespachoDadosPreenchimento).toPromise();

      this.preenchimento = CredenciamentoGtsUtils.metadadosToPreenchimentoDTO(this.despacho.inclusao.metadados);
      this.formPreenchimento.patchValue(this.preenchimento);
      this.formPreenchimento.disable();
      this.isLoading = false;
   }

   addMotivo() {
      this.motivosRevisao.push(this.formRevisao.get('motivoRevisao').value);
      this.formRevisao.get('motivoRevisao').setValue('');
   }

   removeMotivo(index: number) {
      this.motivosRevisao.splice(index, 1);
   }

   avaliarCadastro(status: string) {
      this.saveParecer(status);
      this.tramitar(status);
   }
   saveParecer(statusParecer: string) {
      const parecer: ParecerDTO = new ParecerDTO();

      if (statusParecer.includes("Aprovado")) {
         parecer.status = StatusParecerDTO.APROVADO;
      }
      else if (statusParecer.includes("Reprovado")) {
         parecer.status = StatusParecerDTO.REPROVADO;
         parecer.correcao = this.motivosRevisao;
      }
      this.parecer = CredenciamentoGtsUtils.getUltimoParecer(this.processo);
      this.sendingRequest = true;
      if (this.ultimoDespachoParecer == null) {
         this.credenciamentoService.addParecer(this.uuidProcesso, parecer).subscribe(
            (despachoParecer: DespachoDTO) => {
               this.ultimoDespachoParecer = despachoParecer;
               this.setUuidDespachos();
               this.sendingRequest = false;
            }
         );
      } else {
         this.credenciamentoService.updateParecer(this.uuidProcesso, this.parecer).subscribe( (despachoParecer: DespachoDTO) => {
            this.ultimoDespachoParecer = despachoParecer;
            this.sendingRequest = false;
         });
      }
      this.isLoading = false;
   }

   setUuidDespachos() {
      const codigoDadosPreenchimento = this.isRetorno ? CodigoDescricao.AJUSTE_DADOS_PREENCHIMENTO : CodigoDescricao.DADOS_PREENCHIMENTO;
      this.uuidDespachoDadosPreenchimento = CredenciamentoGtsUtils.getUltimoDespacho(this.processo, codigoDadosPreenchimento)?.uuid;
   }

   tramitar(status: string) {
      let statusTramitacao: StatusTramitacao;
      let mensagem: string;
      let swalTitulo: string;

      if (status == StatusParecerDTO.APROVADO) {
         mensagem = 'Credenciamento aprovado.'
         statusTramitacao = StatusTramitacao.APROVADO;
         swalTitulo = 'CREDENCIAMENTO EFETUADO COM SUCESSO!';
      } else if ([StatusParecerDTO.REPROVADO, StatusParecerDTO.REPROVADO].includes(status as StatusParecerDTO)) {
         mensagem = 'Credenciamento retornado para correção.';
         statusTramitacao = StatusTramitacao.RETORNADO_PARA_CORRECAO;
         swalTitulo = 'CREDENCIAMENTO RETORNADO PARA CORREÇÃO!';
      }
      this.sendingRequest = true;
      this.credenciamentoService.tramitar(this.uuidProcesso, statusTramitacao, mensagem).subscribe(
         () => {
            Swal.fire({
               title: swalTitulo,
               iconHtml: "<img src='./assets/icons/icons-pdsa-svg/step-check-icon.svg'/>",
               confirmButtonText: "OK, ENTENDI"
            }).then((result) => {
               if (result.value) {
                  this.router.navigate(["/principal/gts"]);
               }});
         },
         () => {
            Swal.fire({
               title: "ERRO AO EFETUAR CREDENCIAMENTO!",
               text: "Tente novamente mais tarde. Caso o problema persista, entre em contato com o suporte.",
               icon: "error",
               confirmButtonText: "OK, ENTENDI"
            });
         }
      );
      this.sendingRequest = false;
   }
}
