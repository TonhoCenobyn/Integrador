export class ParecerDTO {
   status: StatusParecerDTO;
   correcao?: string[];
}

export enum StatusParecerDTO {
   APROVADO = 'Aprovado',
   REPROVADO = 'Reprovado',
   PENDENTE = 'Pendente'
}
