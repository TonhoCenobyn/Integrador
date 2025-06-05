import {Injectable} from '@angular/core';
import {AbstractService} from '../../abstract.service';
import {HttpClient} from '@angular/common/http';
import {ProcessoForm} from '../../../model/processos/form/processo.form';
import {Observable, of} from 'rxjs';
import {ProcessoDTO} from '../../../dto/processos/processo-dto';
import {PreenchimentoForm} from '../../../../modulo-cidadao/components/modules/gts/credenciamento/dto/preenchimento.dto';
import {ParecerDTO} from '../../../dto/gts/credenciamento/parecer-credenciamento-dto';
import {DespachoDTO} from '../../../dto/processos/despacho-dto';

@Injectable({providedIn: 'root'})
export class CredenciamentoService extends AbstractService {
   private readonly URL = this.API_REST_DTAM + "/credenciamentoGts";

   constructor(http: HttpClient) {
      super(http);
   }

   create(request: { processo: ProcessoForm; credenciamento: PreenchimentoForm }): Observable<ProcessoDTO> {
      return this.http.post<ProcessoDTO>(this.URL, request);
   }

   getProcesso(uuid: string): Observable<ProcessoDTO> {
      return this.http.get<ProcessoDTO>(`${this.URL}/processo/${uuid}`);
   }

   getDespacho(processoUuid: string, uuid: string): Observable<DespachoDTO> {
      return this.http.get<DespachoDTO>(`${this.URL}/despacho/${processoUuid}/${uuid}`);
   }

   findAllByUsuarioLogado() {
      return this.http.get<ProcessoDTO[]>(`${this.URL}/usuario-logado`);
   }

   findAllTramitados(idUnidade: number): Observable<ProcessoDTO[]> {
      return this.http.get<ProcessoDTO[]>(`${this.URL}/sve/${idUnidade}/tramitadosGts`);
   }

   addParecer(uuidProcesso: string, parecer: ParecerDTO): Observable<DespachoDTO> {
      return this.http.post<DespachoDTO>(`${this.URL}/parecer/${uuidProcesso}`, parecer);
   }

   updateParecer(uuidProcesso: string, parecer: ParecerDTO): Observable<DespachoDTO> {
      return this.http.put<DespachoDTO>(`${this.URL}/parecer/${uuidProcesso}`, parecer);
   }

   tramitar(uuidProcesso: string, codigoStatusTramitacao: string, mensagem: string): Observable<ProcessoDTO>{
      return this.http.post<ProcessoDTO>(`${this.URL}/usuario/${uuidProcesso}/tramitar/${codigoStatusTramitacao}`, mensagem);
   }
}
