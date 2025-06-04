package br.com.pdsars.guiasapi.dto.gts;

import br.com.pdsars.guiasapi.dto.form.gts.PreenchimentoForm;
import br.com.pdsars.guiasapi.dto.form.processo.CredenciamentoCidadaoGtsForm;
import br.com.pdsars.guiasapi.dto.form.processo.ProcessoForm;
import br.com.pdsars.guiasapi.model.gts.Destino;
import lombok.Value;


@Value
public class CredenciamentoRequestDTO {
    ProcessoForm processo;
    PreenchimentoForm credenciamento;

    public static CredenciamentoRequestDTO from(ProcessoForm processo, PreenchimentoForm credenciamento) {
        return new CredenciamentoRequestDTO(processo, credenciamento);
    }
}
