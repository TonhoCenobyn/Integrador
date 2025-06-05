import { DespachoDTO } from "../dto/processos/despacho-dto";
import { ProcessoDTO } from "../dto/processos/processo-dto";
import { Kind } from "../model/processos/despacho";
import { CodigoDescricao } from "../model/gts/codigo-descricao";
import {PreenchimentoDTO} from '../dto/gts/credenciamento/preenchimento-dto';
import {ParecerDTO} from '../dto/gts/credenciamento/parecer-credenciamento-dto';

export class CredenciamentoGtsUtils {
   static metadadosToPreenchimentoDTO(metadados: any): PreenchimentoDTO {
      const preenchimentoDto: PreenchimentoDTO = new PreenchimentoDTO();

      if (metadados) {
         preenchimentoDto.nomeProfissional = metadados['nome_profissional'];
         preenchimentoDto.cpfProfissional = metadados['cpf_profissional'];
         preenchimentoDto.telefoneProfissional = metadados['telefone_profissional'];
         preenchimentoDto.emailProfissional = metadados['email_profissional'];
         preenchimentoDto.crmvProfissional = metadados['crmv_profissional'];
         preenchimentoDto.formacao = metadados['formacao'];
         preenchimentoDto.nomeFantasia = metadados['nome_fantasia'];
         preenchimentoDto.razaoSocial = metadados['razao_social'];
         preenchimentoDto.cnpj = metadados['cnpj'];
         preenchimentoDto.inscricaoEstadual = metadados['inscricao_estadual'];
         preenchimentoDto.telefone = metadados['telefone'];
         preenchimentoDto.celular = metadados['celular'];
         preenchimentoDto.email = metadados['email'];
         preenchimentoDto.crmv = metadados['crmv'];
         preenchimentoDto.cepContratante = metadados['cep_contratante'];
         preenchimentoDto.logradouroContratante = metadados['logradouro_contratante'];
         preenchimentoDto.numeroContratante = metadados['numero_contratante'];
         preenchimentoDto.complementoContratante = metadados['complemento_contratante'];
         preenchimentoDto.municipioContratante = metadados['municipio_contratante'];
         preenchimentoDto.ufContratante = metadados['uf_contratante'];
      }

      return preenchimentoDto;
   }

   static metadadosToParecerCredenciamentoDTO(metadados: any): ParecerDTO {
      if (metadados) {
         const parecerCredenciamentoDTO = new ParecerDTO();

         parecerCredenciamentoDTO.correcao = metadados['correcao'];
         parecerCredenciamentoDTO.status = metadados['status'];

         return parecerCredenciamentoDTO;
      } else {
         return null;
      }
   }

   static getUltimoDespacho(processo: ProcessoDTO, codigo: CodigoDescricao): DespachoDTO {
      return processo.despachos.filter(d => d.codigoDescricao === codigo)
         .sort((a, b) => b.ordemProcesso - a.ordemProcesso)[0];
   }


   static getUltimaTramitacao(processo: ProcessoDTO): DespachoDTO {
      return processo.despachos.filter(d => d.kind == Kind.TRAMITACAO)
         .sort((a, b) => b.ordemProcesso - a.ordemProcesso)[0];
   }

   static getUltimoDespachoParecer(processo: ProcessoDTO): DespachoDTO {
      return processo.despachos.filter(d => d.codigoDescricao === CodigoDescricao.PARECER_CREDENCIAMENTO)
         .sort((a, b) => b.ordemProcesso - a.ordemProcesso)[0];
   }

   static getUltimoParecer(processo: ProcessoDTO): ParecerDTO {
      const despachoParecer = processo.despachos.filter(d => d.codigoDescricao === CodigoDescricao.PARECER_CREDENCIAMENTO)
         .sort((a, b) => b.ordemProcesso - a.ordemProcesso)[0];
      return despachoParecer ? this.metadadosToParecerCredenciamentoDTO(despachoParecer.inclusao.metadados) : null;
   }
}
