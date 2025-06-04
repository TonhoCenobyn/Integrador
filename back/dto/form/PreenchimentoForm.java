package br.com.pdsars.guiasapi.dto.form.gts;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class PreenchimentoForm {
        private Long id;

        private String nomeProfissional;
        private String cpfProfissional;
        private String telefoneProfissional;
        private String emailProfissional;
        private String formacao;
        private String crmvProfissional;

        private String nomeFantasia;
        private String razaoSocial;
        private String cnpj;
        private String inscricaoEstadual;
        private String telefone;
        private String celular;
        private String email;
        private String crmv;

        private String cepContratante;
        private String logradouroContratante;
        private String numeroContratante;
        private String complementoContratante;
        private String municipioContratante;
        private String ufContratante;

}
