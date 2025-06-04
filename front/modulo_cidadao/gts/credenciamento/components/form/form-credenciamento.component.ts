import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {Endereco} from '../../../../../../../app-core/model/endereco.model';
import {FormsService, ViaCEPResponse} from '../../../../../../../app-core/service/forms-service';
import {LoginService} from '../../../../../../../app-core/service/login.service';
import {ToastrService} from 'ngx-toastr';
import {GenericValidator} from '../../../../../../../app-core/utils/validacoes-form';
import Swal from 'sweetalert2';
import {PreenchimentoForm} from '../../dto/preenchimento.dto';
import {ProcessoForm} from '../../../../../../../app-core/model/processos/form/processo.form';
import {TipoProcesso} from '../../../../../../../app-core/model/processos/tipo-processo';
import {ProcessoDTO} from '../../../../../../../app-core/dto/processos/processo-dto';
import {Usuario} from '../../../../../../../app-core/model/usuario.model';
import {CredenciamentoService} from '../../../../../../../app-core/service/gts/credenciamento/credenciamento.service';
import {ActivatedRoute, Router} from '@angular/router';
import {DespachoDTO} from '../../../../../../../app-core/dto/processos/despacho-dto';
import {CredenciamentoGtsUtils} from '../../../../../../../app-core/utils/credenciamento-gts-utils';
import {CodigoDescricao} from '../../../../../../../app-core/model/gts/codigo-descricao';
import {Processo} from '../../../../../../../app-core/model/processos/processo';
import {Empresa} from '../../../../../../../app-core/model/empresa.model';

declare var swal : any;

@Component({
   selector: 'app-form-credenciamento',
   templateUrl: './form-credenciamento.component.html',
   styleUrls: ['./form-credenciamento.component.scss']
})
export class FormCredenciamentoComponent implements OnInit {
   isCorrecao: boolean;

   form: FormGroup;
   preenchimento: PreenchimentoForm;
   sendingRequest: boolean = false;
   loading: boolean = true;

   usuarioLogado: Usuario = this.loginService.getUsuarioLogado();
   empresa: Empresa;

   debounce: Subject<string> = new Subject<string>();

   endereco: Endereco = new Endereco();

   uuidProcesso: string = this.route.snapshot.paramMap.get('processo-uuid')!;
   processo: ProcessoDTO;
   despacho: DespachoDTO;
   constructor(
      private fb: FormBuilder,
      private formsService: FormsService,
      private loginService: LoginService,
      private route: ActivatedRoute,
      private router: Router,
      private credenciamentoService: CredenciamentoService,
      private toastrService: ToastrService
   ) {}

   ngOnInit(): void {
      this.isCorrecao = this.route.snapshot.data['isCorrecao'];

      this.empresa = this.loginService.getUsuarioLogado().empresaLogado;
      console.log('Usuario logado:', JSON.stringify(this.usuarioLogado, null, 2));
      console.log('Empresa logado:', JSON.stringify(this.empresa, null, 2));

      this.form = this.fb.group({
         nomeProfissional: this.fb.control(
            this.usuarioLogado.nome
               ? { value: this.usuarioLogado.nome.toUpperCase(), disabled: true }
               : { value: '', disabled: false },
            [Validators.required]
         ),
         cpfProfissional: this.fb.control(
            this.usuarioLogado.nome
               ? { value: this.usuarioLogado.cpf, disabled: true }
               : { value: '', disabled: false },
            [Validators.required]
         ),
         telefoneProfissional: this.fb.control(this.usuarioLogado.medVeterinario?.telefone ?? "", [
            Validators.required
         ]),
         emailProfissional: this.fb.control(
            { value: this.usuarioLogado.email, disabled: true }
         ),
         formacao: this.fb.control(this.usuarioLogado.medVeterinario?.gtaNumeroHabilitacao ?? "", [
            Validators.required
         ]),
         crmvProfissional: this.fb.control(this.usuarioLogado.medVeterinario?.numeroInscricao ?? "", [
            Validators.required
         ]),

         nomeFantasia: this.fb.control(
            this.empresa?.nomeFantasia
               ? { value: this.empresa.nomeFantasia, disabled: true }
               : { value: '', disabled: false },
            [Validators.required]
         ),
         razaoSocial: this.fb.control(this.empresa?.razaoSocial, [Validators.required]),
         cnpj: this.fb.control(
            this.empresa?.cnpj
               ? { value: this.empresa.cnpj, disabled: true }
               : { value: '', disabled: false },
            [Validators.required]
         ),
         inscricaoEstadual: this.fb.control("", [Validators.required, Validators.minLength(3), Validators.maxLength(50)]),
         telefone: this.fb.control("", [
            Validators.required, Validators.minLength(10)
         ]),
         celular: this.fb.control("", [
            Validators.required, Validators.minLength(10)
         ]),
         email: this.fb.control("", [
            Validators.email
         ]),
         crmv: this.fb.control(this.usuarioLogado.medVeterinario?.numeroInscricao ?? "", [
            Validators.required
         ]),
         cepContratante: this.fb.control("", [
            Validators.required, Validators.minLength(8), Validators.maxLength(9)
         ]),
         logradouroContratante: this.fb.control(
            {value: "", disabled: false},
            [Validators.required, Validators.minLength(3), Validators.maxLength(100)]
         ),
         numeroContratante: this.fb.control(""),
         complementoContratante: this.fb.control("", [
            Validators.maxLength(50)
         ]),
         municipioContratante: this.fb.control(
            {value: "", disabled: false},
            [Validators.required, Validators.minLength(3), Validators.maxLength(100)]
         ),
         ufContratante: this.fb.control(
            {value: "", disabled: false},
            [Validators.required, Validators.minLength(2), Validators.maxLength(2)]
         ),
         uuid: [this.empresa ? this.empresa.uuid : '']
      });

      if (this.isCorrecao) {
         this.setCorrecao();
      } else {
         //this.popularForm();
      }
   }

   onSubmit() {
      if (this.form.valid) {
         this.preenchimento = this.form.getRawValue();
         const processo = new ProcessoForm();
         if (this.isCorrecao) {
            processo.uuid = this.processo.uuid;
         } else {
            processo.tipoProcesso = TipoProcesso.CREDENCIAMENTO_CIDADAO_GTS;
            processo.usuarioId = this.usuarioLogado.id;
            processo.usuarioNome = this.usuarioLogado.nome;
         }
         this.createOrUpdateCredenciamento(processo);
      } else {
         this.form.markAllAsTouched();
         Swal.fire({
            title: "Erro",
            html: "Preencha todos os campos corretamente",
            icon: "error",
         }).then();
      }
   }

   createOrUpdateCredenciamento(processo: ProcessoForm) {
      const request = {
         processo: processo,
         credenciamento: this.preenchimento
      };
      this.sendingRequest = true;
      this.credenciamentoService
         .create(request)
         .subscribe((processo: ProcessoDTO | null) => {
            if (processo) {
               if (processo?.uuid === 'CREDENCIADO') {
                  swal.fire('Erro', 'O usuário já está credenciado para a empresa inserida.', 'error');
               } else {
                  swal.fire('Sucesso', 'Preenchimento submentido para análise', 'success').then( () => {
                     this.form.reset();
                     this.router.navigate(["/principal/gts/home/credenciamento/visualizar"]);
                  });
               }
            } else {
               swal.fire('Erro', 'Uma falha ocorreu no processo de submissão do preenchimento', 'error').then();
            }
            this.sendingRequest = false;
         });
   }

   async setCorrecao() {
      this.processo = await this.credenciamentoService.getProcesso(this.uuidProcesso).toPromise();
      this.despacho = CredenciamentoGtsUtils.getUltimoDespacho(this. processo, CodigoDescricao.DADOS_PREENCHIMENTO);

      this.preenchimento = CredenciamentoGtsUtils.metadadosToPreenchimentoDTO(this.despacho.inclusao.metadados);
      this.form.patchValue(this.preenchimento);
      this.loading = false;
   }

   searchCep() {
      const cep = this.form.get("cepContratante");

      if (cep.valid) {
         this.formsService.getCep(cep.value).subscribe(
            (response) => {
               if (response.erro) {
                  this.toastrService.error("CEP não encontrado");

                  this.form.get("logradouroContratante").enable();
                  this.form.get("municipioContratante").enable();
                  this.form.get("ufContratante").enable();

                  return;
               }

               this.endereco = this.fillEndereco(response);

               this.fillEnderecoForm();
            },
         );
      }
   }

   fillEndereco(viaCEPResponse: ViaCEPResponse): Endereco {
      let endereco = new Endereco();
      endereco.cep = viaCEPResponse.cep;
      endereco.rua = viaCEPResponse.logradouro;
      endereco.bairro = viaCEPResponse.bairro;
      endereco.cidade = viaCEPResponse.localidade;
      endereco.uf = viaCEPResponse.uf;
      return endereco;
   }

   fillEnderecoForm() {
      this.formsService.findAddress(this.endereco, () => {
         this.form.patchValue({
            logradouroContratante: this.endereco.rua,
            bairroContratante: this.endereco.bairro,
            municipioContratante: this.endereco.cidade,
            ufContratante: this.endereco.uf,
            numeroContratante: this.endereco.numero,
         });

         if (!this.form.get("logradouroContratante").value) {
            this.form.get("logradouroContratante").enable();
         } else {
            this.form.get("logradouroContratante").disable();
         }

         if (!this.form.get("municipioContratante").value) {
            this.form.get("municipioContratante").enable();
         } else {
            this.form.get("municipioContratante").disable();
         }

         if (!this.form.get("ufContratante").value) {
            this.form.get("ufContratante").enable();
         } else {
            this.form.get("ufContratante").disable();
         }
      });
   }

   popularForm() {
      this.form.patchValue({
         telefoneProfissional: "55 99999999",
         formacao: "veterinario",
         crmvProfissional: "2353-2",
         razaoSocial: "Estabelecimento teste",
         telefone: "55 99999999",
         celular: "55 99999999",
         email: "estabelecimento@teste",
         crmv: "4949-9",
         cepContratante: "97105900",
         logradouroContratante: "Roraima",
         numeroContratante: "15",
         complementoContratante: "Casa",
         municipioContratante: "Santa Maria",
         ufContratante: "RS",
      });
   }
}
