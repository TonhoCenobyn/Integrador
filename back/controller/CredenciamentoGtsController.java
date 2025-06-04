package br.com.pdsars.guiasapi.controller.gts;

import br.com.pdsars.guiasapi.dto.gts.CredenciamentoRequestDTO;
import br.com.pdsars.guiasapi.dto.processos.DespachoDTO;
import br.com.pdsars.guiasapi.dto.processos.ProcessoDTO;
import br.com.pdsars.guiasapi.service.gts.CredenciamentoGtsService;
import br.com.pdsars.guiasapi.service.processos.DespachoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/credenciamentoGts")
public class CredenciamentoGtsController {
    private final CredenciamentoGtsService credenciamentoService;
    private final DespachoService despachoService;

    public CredenciamentoGtsController(
            CredenciamentoGtsService credenciamentoService,
            DespachoService despachoService
    ) {
        this.credenciamentoService = credenciamentoService;
        this.despachoService = despachoService;
    }

    @PostMapping
    public ResponseEntity<ProcessoDTO> create(@RequestBody CredenciamentoRequestDTO request) {
        ProcessoDTO processoDTO = credenciamentoService.createCredenciamento(
                request.getCredenciamento(), request.getProcesso()
        );
        return ResponseEntity.ok(processoDTO);
    }

    @GetMapping("/processo/{uuid}")
    public ResponseEntity<ProcessoDTO> getByUuid(@PathVariable String uuid) {
        return ResponseEntity.ok(credenciamentoService.getProcessoByUuid(uuid));
    }

    @GetMapping ("/sve/{idUnidade}/tramitadosGts")
    ResponseEntity<List<ProcessoDTO>> getAllProcessosTramitados(@PathVariable Integer idUnidade, @RequestParam(required = false) String statusTramitacao) {
        return ResponseEntity.ok(credenciamentoService.findAllTramitados(idUnidade, statusTramitacao));
    }

    @GetMapping("/despacho/{processoUuid}/{uuid}")
    public ResponseEntity<DespachoDTO> getDespachoByUuid(@PathVariable String processoUuid, @PathVariable String uuid) {
        System.out.println("Despacho uuid: " + uuid);
        System.out.println("Processo uuid: " + processoUuid);
        return ResponseEntity.ok(despachoService.getOne(processoUuid, uuid));
    }

    @GetMapping("/usuario-logado")
    public List<ProcessoDTO> findAllByUsuarioLogado() {
        try {
            return credenciamentoService.findAllByUsuarioLogado();
        } catch (Exception e) {
            e.printStackTrace();
            new ResponseEntity<>(e.getMessage(), HttpStatus.PRECONDITION_FAILED);
        }
        return null;
    }

    @PostMapping("/parecer/{processoUuid}")
    public ResponseEntity<DespachoDTO> addParecer(@PathVariable String processoUuid, @RequestBody Map<String, Object> metadados) {
        return ResponseEntity.ok(credenciamentoService.addParecer(processoUuid, metadados));
    }

    @PutMapping("/parecer/{processoUuid}")
    public ResponseEntity<DespachoDTO> updateParecer(@PathVariable String processoUuid, @RequestBody Map<String, Object> metadados) {
        return ResponseEntity.ok(credenciamentoService.updateParecer(processoUuid, metadados));
    }

    @PostMapping("/usuario/{uuidProcesso}/tramitar/{codigoStatusTramitacao}")
    public ResponseEntity<ProcessoDTO> tramitarUnidade(@PathVariable String uuidProcesso, @PathVariable String codigoStatusTramitacao,
                                                       @RequestBody String mensagem) {
        return ResponseEntity.ok(credenciamentoService.tramitar(uuidProcesso, codigoStatusTramitacao, mensagem));
    }
}

