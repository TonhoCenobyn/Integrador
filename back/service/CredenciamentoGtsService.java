package br.com.pdsars.guiasapi.service.gts;

import br.com.pdsars.guiasapi.dto.credenciamento.*;
import br.com.pdsars.guiasapi.dto.form.UsuarioForm;
import br.com.pdsars.guiasapi.dto.form.gts.CadastroEmpresaForm;
import br.com.pdsars.guiasapi.dto.form.gts.PreenchimentoForm;
import br.com.pdsars.guiasapi.dto.form.processo.*;
import br.com.pdsars.guiasapi.dto.gts.PreenchimentoDTO;
import br.com.pdsars.guiasapi.dto.processos.DespachoDTO;
import br.com.pdsars.guiasapi.dto.processos.InclusaoDTO;
import br.com.pdsars.guiasapi.dto.processos.ProcessoDTO;
import br.com.pdsars.guiasapi.error.BadRequestException;
import br.com.pdsars.guiasapi.error.NotFoundException;
import br.com.pdsars.guiasapi.model.external.*;
import br.com.pdsars.guiasapi.model.permissions.GTSPermissoes;
import br.com.pdsars.guiasapi.model.processo.CodigoDescricao;
import br.com.pdsars.guiasapi.model.processo.StatusTramitacao;
import br.com.pdsars.guiasapi.model.processo.TipoProcesso;
import br.com.pdsars.guiasapi.repository.gts.CredenciamentoGtsRepository;
import br.com.pdsars.guiasapi.security.JwtUser;
import br.com.pdsars.guiasapi.service.external.EmpresaService;
import br.com.pdsars.guiasapi.service.external.UsuarioService;
import br.com.pdsars.guiasapi.service.external.UsuarioVinculoService;
import br.com.pdsars.guiasapi.service.notification.GTSNotificationService;
import br.com.pdsars.guiasapi.service.processos.DespachoService;
import br.com.pdsars.guiasapi.service.processos.ProcessoService;
import br.com.pdsars.guiasapi.utils.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import org.springframework.stereotype.Service;
import javax.transaction.Transactional;
import java.util.*;

@Service
@Transactional
public class CredenciamentoGtsService {
    private final CredenciamentoGtsRepository credenciamentoRepository;
    private final DespachoService despachoService;
    private final ProcessoService processoService;
    private final GTSNotificationService notificationService;
    private final UsuarioService usuarioService;
    private final UsuarioVinculoService usuarioVinculoService;
    private final EmpresaService empresaService;

    ObjectMapper mapper = new ObjectMapper();

    public CredenciamentoGtsService(
            CredenciamentoGtsRepository credenciamentoRepository,
            DespachoService despachoService,
            ProcessoService processoService,
            GTSNotificationService notificationService,
            UsuarioService usuarioService,
            EmpresaService empresaService,
            UsuarioVinculoService usuarioVinculoService
    ) {
        this.credenciamentoRepository = credenciamentoRepository;
        this.despachoService = despachoService;
        this.processoService = processoService;
        this.notificationService = notificationService;
        this.usuarioService = usuarioService;
        this.empresaService = empresaService;
        this.usuarioVinculoService = usuarioVinculoService;

        mapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
    }

    public ProcessoDTO createCredenciamento(PreenchimentoForm credenciamentoCidadaoGtsForm, ProcessoForm tipoProcesso) {
        Usuario usuario = usuarioService.getUsuarioByCpf(credenciamentoCidadaoGtsForm.getCpfProfissional());
        Empresa empresa = empresaService.getByCpfCnpj(credenciamentoCidadaoGtsForm.getCnpj());

        try {
            ProcessoDTO processoDTO = new ProcessoDTO();

            if (empresa != null && usuario != null) {
                List<VinculoPermissao> vinculoPermissoes = usuarioVinculoService.getVinculoPermissoes(usuarioVinculoService.getVinculo(usuario.getId(), empresa.getId()).get().getId());

                List<String> permissoes = new ArrayList<>();

                vinculoPermissoes.forEach(vinculoPermissao -> {
                    permissoes.add(vinculoPermissao.getPermissao());
                });

                if (permissoes.contains("gts.empresa.guias.cadastrar") || permissoes.contains("[gts.empresa.guias.cadastrar, gts.empresa.guias.listar, gts.empresa.guias.editar, gts.empresa.guias.excluir]")) {
                    processoDTO.setUuid("CREDENCIADO");
                    return processoDTO;
                }
            }

            if (tipoProcesso.getUuid() == null) {
                processoDTO = createProcesso(tipoProcesso);
            } else {
                processoDTO = processoService.getByUuid(tipoProcesso.getUuid());
            }

            if (processoDTO == null) {
                throw new IllegalStateException("Falha ao criar processo de credenciamento");
            }

            DespachoDTO novoDespachoInclusao = createDespachoInclusaoPreenchimento(credenciamentoCidadaoGtsForm, processoDTO);

            if (novoDespachoInclusao == null) {
                throw new IllegalStateException("Falha ao criar despacho de inclusao");
            }

            processoDTO = createDespachoTramitacao(processoDTO);

            if (processoDTO == null) {
                throw new IllegalStateException("Falha ao criar processo de tramitacao");
            }
            System.out.println("Montou um processo");
            return processoDTO;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public List<ProcessoDTO> findAllByUsuarioLogado() {
        List<ProcessoDTO> processos = processoService.getAllByUsuarioIdAndTipoProcesso(User.getIdUser(), List.of(TipoProcesso.CREDENCIAMENTO_CIDADAO_GTS));
        return processos;
    }

    public List<ProcessoDTO> findAllTramitados(Integer idUnidade, String statusTramitacao) {
        List<ProcessoDTO> processos = processoService.getAllByStatusProcessoAndTipoProcesso(ProcessoDTO.StatusProcesso.TRAMITADO, TipoProcesso.CREDENCIAMENTO_CIDADAO_GTS);
        List<ProcessoDTO> processosTramitados = new ArrayList<>();

        if (processos != null){
            processos.stream()
                    .filter(p -> p.getDespachos().stream()
                            .anyMatch(d -> d.getTramitacao() != null
                                    && d.getTramitacao().getUnidadeDestino() != null
                                    && d.getTramitacao().getUnidadeDestino().equals(idUnidade)
                                    && (statusTramitacao == null
                                    || (d.getTramitacao().getStatusTramitacao() != null
                                    && d.getTramitacao().getStatusTramitacao().getCodigo().equals(statusTramitacao)))))
                    .forEach(processosTramitados::add);

            return processosTramitados;
        }
        else{
            return null;
        }
    }

    public ProcessoDTO createProcesso(ProcessoForm tipoProcesso) {
        List<ProcessoDTO> processos = processoService.getAllByUsuarioIdAndTipoProcesso(
                tipoProcesso.getUsuarioId(), List.of(TipoProcesso.CREDENCIAMENTO_CIDADAO_GTS)
        );

        if (processos.stream().anyMatch(p -> p.getStatusProcesso() != ProcessoDTO.StatusProcesso.CONCLUIDO)) {
            throw new BadRequestException("Já existe um processo de credenciamento pendente");
        }

        return processoService.create(tipoProcesso);
    }

    public ProcessoDTO getProcessoByUuid(String uuid) {
        return this.processoService.getByUuid(uuid);
    }

    private ProcessoDTO createDespachoTramitacao(ProcessoDTO processo) {
        DespachoForm despachoForm = new DespachoForm();

        TramitacaoForm tramitacaoForm = new TramitacaoForm();
        Integer unidadeDestino = credenciamentoRepository.getUnidadeByNome("SCTQ");

        tramitacaoForm.setStatusTramitacao(new TramitacaoForm.StatusTramitacaoForm(StatusTramitacao.GTS_1));
        tramitacaoForm.setMensagem("Formulário de Credenciamento GTS enviado para análise");
        tramitacaoForm.setUnidadeDestino(unidadeDestino);
        tramitacaoForm.setUnidadeDestinoNome("SCTQ");

        ArquivoForm arquivoForm = new ArquivoForm();

        arquivoForm.setBody(createArquivoBody("<p>" + tramitacaoForm.getMensagem() + "</p>"));

        despachoForm.setArquivo(arquivoForm);
        despachoForm.setTramitacao(tramitacaoForm);
        despachoForm.setKind(DespachoDTO.Kind.TRAMITACAO);
        despachoForm.setUsuarioAcao(User.getIdUser());
        despachoForm.setUsuarioAcaoNome(User.getUser().getUsuario().getNome());

       despachoService.create(processo.getUuid(), despachoForm);

       return processoService.getByUuid(processo.getUuid());
    }

    public DespachoDTO addParecer(String uuidProcesso, Map<String, Object> metadados) {
        ProcessoDTO processo = processoService.getByUuid(uuidProcesso);

        if (processo.getDespachos().stream().anyMatch(d ->
                CodigoDescricao.PARECER_CREDENCIAMENTO.equals(d.getCodigoDescricao()) && d.getPendente()
        )) {
            throw new BadRequestException("Existe um parecer pendente para este processo");
        }

        DespachoForm despacho = new DespachoForm();

        despacho.setCodigoDescricao(CodigoDescricao.PARECER_CREDENCIAMENTO);
        despacho.setKind(DespachoDTO.Kind.INCLUSAO);
        despacho.setUsuarioAcao(User.getIdUser());
        despacho.setUsuarioAcaoNome(User.getUser().getUsuario().getNome());
        despacho.setArquivo(new ArquivoForm());

        despacho.getArquivo().setBody(createArquivoBody(""));

        if (metadados != null) {
            despacho.setInclusao(new InclusaoForm());
            despacho.getInclusao().setMetadados(metadados);
        }

        return despachoService.create(processo.getUuid(), despacho);
    }

    public DespachoDTO updateParecer(String uuidProcesso, Map<String, Object> metadados) {
        ProcessoDTO processo = processoService.getByUuid(uuidProcesso);

        DespachoDTO despacho = processo.getDespachos().stream()
                .filter(d -> CodigoDescricao.PARECER_CREDENCIAMENTO.equals(d.getCodigoDescricao()) && d.getPendente())
                .findFirst()
                .orElse(null);

        if (despacho == null) throw new NotFoundException("Parecer não encontrado");

        despacho.setInclusao(new InclusaoDTO());
        metadados = mapper.convertValue(metadados, Map.class);
        despacho.getInclusao().setMetadados(metadados);

        StringBuilder bodyBuilder = new StringBuilder();

        ParecerCredenciamentoDTO parecerCredenciamento = mapper.convertValue(metadados, ParecerCredenciamentoDTO.class);

        bodyBuilder.append("<table>");

        for(ParecerCredenciamentoDTO.ParecerDTO parecer: parecerCredenciamento.getPareceres()) {
            bodyBuilder.append("<tr><th colspan=\"2\">").append(parecer.getItem()).append("</th></tr>");
            bodyBuilder.append("<tr><td>Status</td><td>").append(parecer.getStatus()).append("</td></tr>");
        }

        bodyBuilder.append("</table>");

        despacho.getArquivo().setBody(createArquivoBody(bodyBuilder.toString()));

        return despachoService.update(processo.getUuid(), despacho.getUuid(), despacho);
    }

    public ProcessoDTO tramitar(String uuidProcesso, String codigoStatusTramitacao, String mensagem) {
        ProcessoDTO processo = processoService.getByUuid(uuidProcesso);

        DespachoForm despacho = new DespachoForm();

        JwtUser usuario = User.getUser();

        despacho.setKind(DespachoDTO.Kind.TRAMITACAO);
        despacho.setUsuarioAcao(User.getIdUser());
        despacho.setUsuarioAcaoNome(User.hasPermission("cidadao") ? usuario.getUsuario().getNome() : "SCTQ");

        TramitacaoForm tramitacao = new TramitacaoForm();

        tramitacao.setMensagem(mensagem);
        StatusTramitacao statusTramitacao = StatusTramitacao.getByCodigo(codigoStatusTramitacao);
        tramitacao.setStatusTramitacao(new TramitacaoForm.StatusTramitacaoForm(Objects.requireNonNull(statusTramitacao)));

        tramitacao.setUnidadeDestino(
                User.hasPermission("cidadao") ? credenciamentoRepository.getUnidadeByNome("SCTQ") : processo.getUsuarioId()
        );
        tramitacao.setUnidadeDestinoNome(User.hasPermission("cidadao") ? "SCTQ" : processo.getUsuarioNome());

        despacho.setTramitacao(tramitacao);

        despacho.setArquivo(new ArquivoForm());

        despacho.getArquivo().setBody(createArquivoBody("<p>" + mensagem + "</p>"));
        DespachoDTO despachoCreated = despachoService.create(processo.getUuid(), despacho);

        if (despachoCreated == null) throw new RuntimeException("Erro ao tramitar processo");

        if (Objects.equals(statusTramitacao.getCodigo(), StatusTramitacao.GTS_1.getCodigo())) {
            processo.setStatusProcesso(ProcessoDTO.StatusProcesso.TRAMITADO);
        }
        else if (Objects.equals(statusTramitacao.getCodigo(), StatusTramitacao.GTS_2.getCodigo())) {
            processo.setStatusProcesso(ProcessoDTO.StatusProcesso.EM_DIGITACAO);
        }

        PreenchimentoDTO preenchimentoDTO = getPreenchimento(processo);

        if (Objects.equals(statusTramitacao.getCodigo(), StatusTramitacao.GTS_4.getCodigo())) {
            aprovarCredenciamento(processo);
        }

        if (
                Objects.equals(statusTramitacao.getCodigo(), StatusTramitacao.GTS_1.getCodigo())
                        || Objects.equals(statusTramitacao.getCodigo(), StatusTramitacao.GTS_3.getCodigo())
        ) {
            notificationService.sendCredenciamentoSolicitado(
                    tramitacao.getUnidadeDestino(), preenchimentoDTO.getEmpresa().getNomeFantasia(), processo.getUuid()
            );
        } else if (
                Objects.equals(statusTramitacao.getCodigo(), StatusTramitacao.GTS_2.getCodigo())
                        || Objects.equals(statusTramitacao.getCodigo(), StatusTramitacao.GTS_4.getCodigo())
        ) {
            notificationService.sendCredenciamentoAnalisado(
                    processo.getUsuarioId(), statusTramitacao.getDescricao(), processo.getUuid()
            );
        }
        processoService.update(uuidProcesso, processo);
        return processoService.getByUuid(processo.getUuid());
    }

    private ProcessoDTO aprovarCredenciamento(ProcessoDTO processo) {
        DespachoDTO despachoDadosPreenchimento = processo.getDespachos().stream()
                .filter(d -> CodigoDescricao.DADOS_PREENCHIMENTO.equals(d.getCodigoDescricao()))
                .max(Comparator.comparing(DespachoDTO::getOrdemProcesso))
                .orElse(null);

        if (despachoDadosPreenchimento == null) {
            throw new RuntimeException("Despachos não encontrados para aprovação do credenciamento");
        }

        PreenchimentoDTO dadosPreenchimento = mapper.convertValue(despachoDadosPreenchimento.getInclusao().getMetadados(), PreenchimentoDTO.class);
        String cnpjEmpresa = dadosPreenchimento.getCnpj();

        //CRIA O USUARIO
        Usuario usuario = usuarioService.getUsuarioById(processo.getUsuarioId());
        if (usuario == null) {
            UsuarioForm usuarioForm = UsuarioForm.builder()
                    .nome(dadosPreenchimento.getNomeProfissional())
                    .email(dadosPreenchimento.getEmailProfissional())
                    .cpf(dadosPreenchimento.getCpfProfissional())
                    .crmv(dadosPreenchimento.getCrmvProfissional())
                    .telefone(dadosPreenchimento.getTelefoneProfissional())
                    .build();
            usuario = this.usuarioService.createUsuario(usuarioForm);
        }

        //CRIA EMPRESA
        Empresa empresa = empresaService.getByCpfCnpj(cnpjEmpresa);
        if (empresa == null) {
            CadastroEmpresaForm novaEmpresa = new CadastroEmpresaForm();

            //DADOS BASICOS
            novaEmpresa.setCnpj(dadosPreenchimento.getCnpj());
            novaEmpresa.setNomeFantasia(dadosPreenchimento.getNomeFantasia());
            novaEmpresa.setRazaoSocial(dadosPreenchimento.getRazaoSocial());
            novaEmpresa.setInscricaoEstadual(dadosPreenchimento.getInscricaoEstadual());
            novaEmpresa.setEmail(dadosPreenchimento.getEmail());
            novaEmpresa.setTelefone(dadosPreenchimento.getTelefone());

            //DADOS DE ENDERECO
            novaEmpresa.setCep(dadosPreenchimento.getCepContratante());
            novaEmpresa.setLogradouro(dadosPreenchimento.getLogradouroContratante());
            novaEmpresa.setNumero(dadosPreenchimento.getNumeroContratante());
            novaEmpresa.setComplemento(dadosPreenchimento.getComplementoContratante());
            novaEmpresa.setMunicipio(dadosPreenchimento.getMunicipioContratante());
            novaEmpresa.setUf(dadosPreenchimento.getUfContratante());
            empresaService.create(novaEmpresa);
        }
        empresa = empresaService.getByCpfCnpj(dadosPreenchimento.getCnpj());

        Optional <UsuarioVinculo> usuarioVinculo = usuarioVinculoService.getVinculo(usuario.getId(), empresa.getId());

        if (!usuarioVinculo.isPresent()) {
            usuarioVinculoService.vincularUsuarioEmpresa(usuario.getId(), empresa.getId());
        }
        usuarioVinculo = usuarioVinculoService.getVinculo(usuario.getId(), empresa.getId());

        this.usuarioVinculoService.vincularPermissaoUsuario(usuarioVinculo.get().getId(), String.valueOf(List.of(GTSPermissoes.EMISSAO_GTS_CREATE, GTSPermissoes.EMISSAO_GTS_READ, GTSPermissoes.EMISSAO_GTS_UPDATE, GTSPermissoes.EMISSAO_GTS_DELETE)));
        return processoService.complete(processo.getUuid());
    }

    public PreenchimentoDTO getPreenchimento(ProcessoDTO processo) {
        DespachoDTO despacho = processo.getDespacho(CodigoDescricao.DADOS_PREENCHIMENTO);

        if (despacho == null) throw new NotFoundException("Nenhum despacho de dados básicos encontrado");

        Map<String, Object> metadados = despacho.getInclusao().getMetadados();

        PreenchimentoDTO preenchimentoDTO = PreenchimentoDTO.builder()
                .nomeProfissional((String) metadados.get("nomeProfissional"))
                .cpfProfissional((String) metadados.get("cpfProfissional"))
                .telefoneProfissional((String) metadados.get("telefoneProfissional"))
                .emailProfissional((String) metadados.get("emailProfissional"))
                .formacao((String) metadados.get("formacao"))
                .crmvProfissional((String) metadados.get("crmvProfissional"))
                .nomeFantasia((String) metadados.get("nomeFantasia"))
                .razaoSocial((String) metadados.get("razaoSocial"))
                .cnpj((String) metadados.get("cnpj"))
                .inscricaoEstadual((String) metadados.get("inscricaoEstadual"))
                .telefone((String) metadados.get("telefone"))
                .email((String) metadados.get("email"))
                .crmv((String) metadados.get("crmv"))
                .cepContratante((String) metadados.get("cepContratante"))
                .logradouroContratante((String) metadados.get("logradouroContratante"))
                .numeroContratante((String) metadados.get("numeroContratante"))
                .complementoContratante((String) metadados.get("complementoContratante"))
                .municipioContratante((String) metadados.get("municipioContratante"))
                .ufContratante((String) metadados.get("ufContratante"))
                .build();

        return preenchimentoDTO;
    }

    private DespachoDTO createDespachoInclusaoPreenchimento(PreenchimentoForm credenciamentoCidadaoGtsForm, ProcessoDTO processoDTO) {
        DespachoForm despachoForm = new DespachoForm();
        despachoForm.setCodigoDescricao(CodigoDescricao.DADOS_PREENCHIMENTO);
        despachoForm.setUsuarioAcao(User.getIdUser());
        despachoForm.setUsuarioAcaoNome(User.getUser().getUsuario().getNome());
        despachoForm.setKind(DespachoDTO.Kind.INCLUSAO);

        InclusaoForm inclusaoForm = createInclusaoForm(credenciamentoCidadaoGtsForm);
        despachoForm.setInclusao(inclusaoForm);

        ArquivoForm arquivoForm = new ArquivoForm();

        arquivoForm.setBody(createArquivoBody(
                "<h4>Dados do Profissional</h4>" +
                        "<p><strong>Nome:</strong> " + credenciamentoCidadaoGtsForm.getNomeProfissional() + "</p>" +
                        "<p><strong>CPF:</strong> " + credenciamentoCidadaoGtsForm.getCpfProfissional() + "</p>" +
                        "<p><strong>Telefone:</strong> " + credenciamentoCidadaoGtsForm.getTelefone() + "</p>" +
                        "<p><strong>Email:</strong> " + credenciamentoCidadaoGtsForm.getEmail() + "</p>" +
                        "<p><strong>Formação:</strong> " + credenciamentoCidadaoGtsForm.getFormacao() + "</p>" +
                        "<p><strong>CRMV:</strong> " + credenciamentoCidadaoGtsForm.getCrmvProfissional() + "</p>" +

                        "<h4>Dados da Empresa</h4>" +
                        "<p><strong>Nome Fantasia:</strong> " + credenciamentoCidadaoGtsForm.getNomeFantasia() + "</p>" +
                        "<p><strong>Razão Social:</strong> " + credenciamentoCidadaoGtsForm.getRazaoSocial() + "</p>" +
                        "<p><strong>CNPJ:</strong> " + credenciamentoCidadaoGtsForm.getCnpj() + "</p>" +
                        "<p><strong>Inscrição Estadual:</strong> " + credenciamentoCidadaoGtsForm.getInscricaoEstadual() + "</p>" +
                        "<p><strong>Telefone:</strong> " + credenciamentoCidadaoGtsForm.getTelefone() + "</p>" +
                        "<p><strong>Celular:</strong> " + credenciamentoCidadaoGtsForm.getCelular() + "</p>" +
                        "<p><strong>Email:</strong> " + credenciamentoCidadaoGtsForm.getEmail() + "</p>" +
                        "<p><strong>CRMV Estabelecimento:</strong> " + credenciamentoCidadaoGtsForm.getCrmv() + "</p>" +

                        "<h4>Dados de Endereço</h4>" +
                        "<p><strong>CEP:</strong> " + credenciamentoCidadaoGtsForm.getCepContratante() + "</p>" +
                        "<p><strong>Logradouro:</strong> " + credenciamentoCidadaoGtsForm.getLogradouroContratante() + "</p>" +
                        "<p><strong>Número:</strong> " + credenciamentoCidadaoGtsForm.getNumeroContratante() + "</p>" +
                        "<p><strong>Complemento:</strong> " + credenciamentoCidadaoGtsForm.getComplementoContratante() + "</p>" +
                        "<p><strong>Município:</strong> " + credenciamentoCidadaoGtsForm.getMunicipioContratante() + "</p>" +
                        "<p><strong>UF:</strong> " + credenciamentoCidadaoGtsForm.getUfContratante() + "</p>"
        ));
        despachoForm.setArquivo(arquivoForm);

        return despachoService.create(processoDTO.getUuid(), despachoForm);
    }

    private InclusaoForm createInclusaoForm(PreenchimentoForm credenciamentoCidadaoGtsForm) {
        InclusaoForm inclusaoForm = new InclusaoForm();
        inclusaoForm.setArquivosAnexos(new ArrayList<>());

        Map<String, Object> metadados = mapper.convertValue(credenciamentoCidadaoGtsForm, Map.class);

        inclusaoForm.setMetadados(metadados);

        return inclusaoForm;
    }

    public String createArquivoBody(String body) {
        return "<html><head><style>body {font-family: Helvetica, sans-serif;}</style></head><body>" + body + "</body></html>";
    }
}
