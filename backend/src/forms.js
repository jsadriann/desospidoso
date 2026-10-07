// Definição das funções profissionais e dos questionários de cada uma.
// É a fonte única: o frontend busca isto em GET /api/forms para montar os
// formulários, e o backend usa para validar respostas e gerar a ficha/PDF.

export const ROLES = {
  ASSISTENTE_SOCIAL: 'Assistente social',
  ENFERMEIRO: 'Enfermeiro',
  FISIOTERAPEUTA: 'Fisioterapeuta',
  MEDICO: 'Médico',
  NUTRICIONISTA: 'Nutricionista',
  PSICOLOGO: 'Psicólogo / Psiquiatra',
  TERAPEUTA_OCUPACIONAL: 'Terapeuta ocupacional',
};

export const AXES = {
  CLINICA_MEDICA: 'Clínica médica',
  CIRURGICO: 'Cirúrgico',
  UTI: 'UTI',
};

const SIM_NAO = [
  { value: 'sim', label: 'Sim.' },
  { value: 'nao', label: 'Não.' },
];

const ORIENTACAO = [
  { value: 'orientado', label: 'Orientado.' },
  { value: 'parcialmente_orientado', label: 'Parcialmente orientado.' },
  { value: 'parcialmente_desorientado', label: 'Parcialmente desorientado.' },
  { value: 'desorientado', label: 'Desorientado.' },
  { value: 'inconsciente', label: 'Inconsciente.' },
];

const MOBILIDADE = (prefix) => ({
  id: 'mobilidade',
  type: 'radio',
  label: 'Qual o estado do paciente em relação à mobilidade?',
  options: [
    { value: 'deambula_sem_auxilio', label: 'Deambula sem auxílio de um dispositivo.' },
    {
      value: 'deambula_com_auxilio',
      label: 'Deambula com auxílio de um dispositivo.',
      input: { id: `${prefix}dispositivo`, label: 'Dispositivo', placeholder: 'Objeto de apoio' },
    },
    { value: 'reduzida_temporaria', label: 'Parcialmente reduzida - Condição temporária.' },
    { value: 'reduzida_cronica_superior', label: 'Parcialmente reduzida - Condição crônica membro superior.' },
    { value: 'reduzida_cronica_inferior', label: 'Parcialmente reduzida - Condição crônica membro inferior.' },
    { value: 'acamado_temporariamente', label: 'Acamado temporariamente.' },
    { value: 'acamado', label: 'Acamado.' },
  ],
});

const ORIENTACAO_Q = {
  id: 'orientacao',
  type: 'radio',
  label: 'Qual o estado de orientação do paciente em relação ao tempo, espaço e a si mesmo?',
  options: ORIENTACAO,
};

export const FORMS = [
  {
    role: 'ASSISTENTE_SOCIAL',
    title: 'Perfil Socioeconômico (Assistente social)',
    icon: 'assistente-social',
    questions: [
      {
        id: 'documentos',
        type: 'group',
        label: 'Apresenta RG, CPF e certidão de nascimento no momento da internação?',
        items: [
          { id: 'rg', type: 'radio', label: 'RG', options: SIM_NAO },
          { id: 'cpf', type: 'radio', label: 'CPF', options: SIM_NAO },
          { id: 'certidao', type: 'radio', label: 'Certidão de nascimento', options: SIM_NAO },
        ],
      },
      {
        id: 'segunda_via',
        type: 'radio',
        label: 'Precisa providenciar segunda via de documento de identificação no período da internação?',
        options: [
          { value: 'caminhao_cidadao', label: 'Sim, acionar caminhão do cidadão.' },
          { value: 'cartorio', label: 'Sim, acionar cartório.' },
          {
            value: 'interior',
            label: 'Sim, residente no interior do CE - Acionar rede socioassistencial do município de origem ou em que reside.',
          },
          {
            value: 'papiloscopia',
            label: 'Não, paciente inconsciente sem documento com foto ou paciente que nunca teve documentação - Acionar papiloscopia.',
          },
        ],
      },
      {
        id: 'perfil_socioeconomico',
        type: 'radio',
        label: 'Qual o perfil socioeconômico do paciente?',
        options: [
          { value: 'pensao', label: 'Pensão.' },
          { value: 'aposentadoria', label: 'Aposentadoria.' },
          { value: 'beneficio', label: 'Benefício socioassistencial.' },
          { value: 'sem_renda', label: 'Sem renda fixa.' },
        ],
      },
      {
        id: 'residencia',
        type: 'radio',
        label: 'O paciente possui residência fixa?',
        options: [
          { value: 'propria', label: 'Sim, própria.' },
          { value: 'alugada', label: 'Sim, alugada.' },
          { value: 'cedida', label: 'Sim, cedida.' },
          { value: 'situacao_rua', label: 'Não, em situação de rua.' },
          { value: 'institucionalizado', label: 'Não, institucionalizado.' },
        ],
      },
      {
        id: 'rede_apoio',
        type: 'radio',
        label: 'O paciente possui uma rede de apoio familiar ou afetiva?',
        options: SIM_NAO,
      },
      {
        id: 'ilpi',
        type: 'radio',
        label: 'Em situação de alta o paciente precisará de ILPI? Se sim, ele ou a sua família podem prover o custeio?',
        options: [
          { value: 'sim_pode_custear', label: 'Sim, o paciente ou os seus familiares podem prover o custeio e os cuidados.' },
          { value: 'sim_nao_pode_custear', label: 'Sim, o paciente ou os seus familiares NÃO podem prover o custeio e os cuidados.' },
          { value: 'nao', label: 'Não.' },
        ],
      },
      {
        id: 'relatorio',
        type: 'radio',
        label: 'Qual é o relatório necessário para o caso deste paciente?',
        options: [
          { value: 'sdhds', label: 'Relatório para central de vagas SDHDS.' },
          { value: 'promotoria', label: 'Relatório para Promotoria de Defesa da Pessoa Idosa.' },
          {
            value: 'ambos',
            label: 'Os dois, relatório para central de vagas SDHDS e relatório para Promotoria de Defesa da Pessoa Idosa.',
          },
        ],
      },
    ],
  },
  {
    role: 'ENFERMEIRO',
    title: 'Condições clínicas (Enfermeiro)',
    icon: 'enfermeiro',
    questions: [
      ORIENTACAO_Q,
      MOBILIDADE(''),
      {
        id: 'lesoes',
        type: 'radio',
        label: 'O paciente possui lesões?',
        options: [
          {
            value: 'sim',
            label: 'Sim.',
            input: { id: 'lesoes_descricao', label: 'Descrição das lesões (opcional)', optional: true },
          },
          { value: 'nao', label: 'Não.' },
        ],
      },
      {
        id: 'integridade_pele',
        type: 'text',
        label: 'Como está a integridade da pele do paciente?',
        inputLabel: 'Descrição sobre a integridade da pele (opcional)',
        optional: true,
      },
      {
        id: 'usa_medicacoes',
        type: 'radio',
        label: 'O paciente está utilizando medicações?',
        options: [
          {
            value: 'sim',
            label: 'Sim.',
            followUp: [
              {
                id: 'tipos_medicacao',
                type: 'checkbox',
                label: 'Quais os tipos e as medicações que este paciente está utilizando? (Você pode marcar mais de uma opção)',
                options: [
                  {
                    value: 'oral',
                    label: 'Por via oral.',
                    input: { id: 'medicacoes_oral', label: 'Medicações', placeholder: 'Dorflex, Virtuoso e Melatonina' },
                  },
                  {
                    value: 'endovenosa',
                    label: 'Endovenosa.',
                    input: { id: 'medicacoes_endovenosa', label: 'Medicações', placeholder: 'Dorflex, Virtuoso e Melatonina' },
                  },
                ],
              },
            ],
          },
          { value: 'nao', label: 'Não.' },
        ],
      },
      {
        id: 'diagnostico',
        type: 'text',
        label: 'Qual o diagnóstico principal do paciente?',
        inputLabel: 'Diagnóstico principal',
      },
      {
        id: 'tem_comorbidade',
        type: 'radio',
        label: 'O paciente apresenta alguma comorbidade?',
        options: [
          {
            value: 'sim',
            label: 'Sim.',
            followUp: [
              {
                id: 'comorbidades',
                type: 'checkbox',
                label: 'Quais os tipos de comorbidades que este paciente apresenta? (Você pode marcar mais de uma opção)',
                options: [
                  { value: 'hipertensao', label: 'Hipertensão.' },
                  { value: 'diabetes', label: 'Diabetes.' },
                  { value: 'cardiacos', label: 'Problemas cardíacos.' },
                  {
                    value: 'outras',
                    label: 'Outras.',
                    input: { id: 'outras_comorbidades', label: 'Outras comorbidades' },
                  },
                ],
              },
            ],
          },
          { value: 'nao', label: 'Não.' },
        ],
      },
    ],
  },
  {
    role: 'FISIOTERAPEUTA',
    title: 'Condições clínicas/ motora (Fisioterapeuta)',
    icon: 'fisioterapeuta',
    questions: [
      {
        id: 'condicao_respiratoria',
        type: 'checkbox',
        label: 'Qual a condição respiratória do paciente em caso de alta? (Você pode marcar mais de uma opção)',
        options: [
          { value: 'ar_ambiente', label: 'Ar ambiente' },
          { value: 'oxigenio', label: 'Oxigênio' },
          { value: 'traqueostomo', label: 'Traqueóstomo' },
        ],
      },
      {
        id: 'deficiencia_fisica',
        type: 'radio',
        label:
          'O paciente é uma pessoa com deficiência física? Se sim, ele necessita de dispositivos para locomoção (muletas, andador, cadeira de rodas)?',
        options: [
          {
            value: 'sim',
            label: 'Sim.',
            input: { id: 'dispositivos_locomocao', label: 'Dispositivos para locomoção', placeholder: 'Muletas' },
          },
          { value: 'sim_sem_dispositivo', label: 'Sim, mas não necessita de dispositivos para locomoção.' },
          { value: 'nao', label: 'Não.' },
        ],
      },
      {
        id: 'reabilitacao',
        type: 'radio',
        label: 'O paciente precisa de reabilitação? Se sim, qual tipo ou quais tipos?',
        options: [
          { value: 'motora', label: 'Sim, motora.' },
          { value: 'respiratoria', label: 'Sim, respiratória.' },
          { value: 'motora_respiratoria', label: 'Sim, motora e respiratória.' },
          { value: 'nao', label: 'Não.' },
        ],
      },
    ],
  },
  {
    role: 'MEDICO',
    title: 'Condições Clínicas (Médico)',
    icon: 'medico',
    questions: [
      ORIENTACAO_Q,
      MOBILIDADE(''),
      {
        id: 'diagnostico',
        type: 'text',
        label: 'Qual o diagnóstico principal do paciente?',
        inputLabel: 'Diagnóstico principal',
      },
      {
        id: 'condicao_alta',
        type: 'radio',
        label: 'Qual a provável condição clínica do paciente em caso de alta?',
        options: [
          { value: 'alta_melhorada', label: 'Alta melhorada.' },
          { value: 'cuidados_paliativos', label: 'Cuidados paliativos.' },
        ],
      },
    ],
  },
  {
    role: 'NUTRICIONISTA',
    title: 'Alimentação (Nutricionista)',
    icon: 'nutricionista',
    questions: [
      {
        id: 'estado_nutricional',
        type: 'radio',
        label: 'Qual o estado nutricional do paciente?',
        options: [
          { value: 'desnutrido', label: 'Desnutrido.' },
          { value: 'normal', label: 'Normal.' },
          { value: 'obeso', label: 'Obeso.' },
        ],
      },
      {
        id: 'indicacao_alimentacao',
        type: 'radio',
        label: 'Qual a provável indicação de alimentação em caso de alta hospitalar?',
        options: [
          { value: 'oral', label: 'Alimentação oral.' },
          { value: 'oral_assistida', label: 'Alimentação oral assistida.' },
          { value: 'sonda', label: 'Alimentação por sonda.' },
          { value: 'dieta_especial', label: 'Dieta especial em decorrência de comorbidades, suplementos alimentares.' },
        ],
      },
    ],
  },
  {
    role: 'PSICOLOGO',
    title: 'Saúde Mental (Psicólogo / Psiquiatra)',
    icon: 'psicologo',
    questions: [
      {
        id: 'sintomas',
        type: 'radio',
        label: 'O paciente apresenta sintomas de agravo à saúde mental? Se sim, quais?',
        options: [
          {
            value: 'sim',
            label: 'Sim, o paciente apresenta sintomas.',
            input: { id: 'sintomas_descricao', label: 'Sintomas' },
          },
          { value: 'nao', label: 'Não.' },
        ],
      },
      {
        id: 'psicofarmacos',
        type: 'radio',
        label: 'O paciente faz uso de psicofármacos? Se sim, quais?',
        options: [
          { value: 'sim', label: 'Sim.', input: { id: 'psicofarmacos_descricao', label: 'Psicofármacos' } },
          { value: 'nao', label: 'Não.' },
        ],
      },
      {
        id: 'acompanhamento',
        type: 'radio',
        label: 'O paciente já é acompanhado para tratamento da saúde mental? Se sim, em qual local de tratamento?',
        options: [
          {
            value: 'sim',
            label: 'Sim, o paciente já faz acompanhamento em um local de tratamento.',
            input: { id: 'local_tratamento', label: 'Local de tratamento' },
          },
          {
            value: 'nao_necessita',
            label: 'Não, mas o paciente necessita de cuidados mais especializados na rede de saúde mental.',
            input: { id: 'observacoes', label: 'Observações (opcional)', optional: true },
          },
          { value: 'nao', label: 'Não.' },
        ],
      },
      {
        ...ORIENTACAO_Q,
        options: [
          ...ORIENTACAO,
          { value: 'sindrome_demencial', label: 'Síndrome demencial.' },
          { value: 'alzheimer', label: 'Doença de Alzheimer.' },
          {
            value: 'outros',
            label: 'Outros.',
            input: { id: 'outros_estados', label: 'Outros estados do paciente' },
          },
        ],
      },
    ],
  },
  {
    role: 'TERAPEUTA_OCUPACIONAL',
    title: 'Auto cuidado (Terapia ocupacional)',
    icon: 'terapeuta-ocupacional',
    questions: [
      {
        id: 'abvds',
        type: 'radio',
        label: 'Qual o estado do paciente em relação aos ABVD’s?',
        options: [
          { value: 'independente', label: 'O paciente realiza ABVD’s independentemente.' },
          { value: 'incapacitado_temporario', label: 'O paciente está incapacitado para realizar ABVD’s temporariamente.' },
          { value: 'dependente', label: 'O paciente está incapacitado para realizar ABVD’s - Dependente de cuidados.' },
          { value: 'comprometimento_cognitivo', label: 'O paciente apresenta comprometimento cognitivo que não permite o autocuidado.' },
          { value: 'orteses', label: 'O paciente possui a necessidade de órteses.' },
        ],
      },
    ],
  },
];

export const ROLE_ORDER = FORMS.map((f) => f.role);
export const TOTAL_SECTIONS = FORMS.length;
export const formByRole = (role) => FORMS.find((f) => f.role === role);

const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);

/**
 * Valida as respostas de uma seção. Retorna a lista de erros (vazia = ok)
 * e um objeto "limpo" só com as chaves conhecidas.
 */
export function validateAnswers(role, answers = {}) {
  const form = formByRole(role);
  if (!form) return { errors: ['Função inválida.'], clean: {} };
  const errors = [];
  const clean = {};

  const walk = (questions) => {
    for (const q of questions) {
      if (q.type === 'group') {
        walk(q.items);
        continue;
      }
      const value = answers[q.id];
      if (q.type === 'text') {
        if (!isEmpty(value)) clean[q.id] = String(value).trim();
        else if (!q.optional) errors.push(`Responda: ${q.label}`);
        continue;
      }
      const selected = q.type === 'checkbox' ? (Array.isArray(value) ? value : []) : value ? [value] : [];
      const valid = selected.filter((v) => q.options.some((o) => o.value === v));
      if (valid.length === 0) {
        if (!q.optional) errors.push(`Responda: ${q.label}`);
        continue;
      }
      clean[q.id] = q.type === 'checkbox' ? valid : valid[0];
      for (const opt of q.options.filter((o) => valid.includes(o.value))) {
        if (opt.input) {
          const text = answers[opt.input.id];
          if (!isEmpty(text)) clean[opt.input.id] = String(text).trim();
          else if (!opt.input.optional) errors.push(`Preencha: ${opt.input.label}`);
        }
        if (opt.followUp) walk(opt.followUp);
      }
    }
  };
  walk(form.questions);
  return { errors, clean };
}

/**
 * Converte respostas em blocos legíveis (usado na tela de detalhes e no PDF):
 * [{ question, subtitle?, lines: ['-Sim.'], extras: [{label, value}] }]
 */
export function describeAnswers(role, answers = {}) {
  const form = formByRole(role);
  if (!form) return [];
  const blocks = [];
  const walk = (questions, group) => {
    for (const q of questions) {
      if (q.type === 'group') {
        blocks.push({ question: q.label, lines: [], extras: [], isGroup: true });
        walk(q.items, q);
        continue;
      }
      const block = { question: group ? null : q.label, subtitle: group ? q.label : null, lines: [], extras: [] };
      const value = answers[q.id];
      if (q.type === 'text') {
        if (isEmpty(value)) block.lines.push('-Não informado.');
        else block.extras.push({ label: (q.inputLabel || 'Resposta').replace(' (opcional)', ''), value });
        blocks.push(block);
        continue;
      }
      const selected = q.type === 'checkbox' ? value || [] : value ? [value] : [];
      const chosen = q.options.filter((o) => selected.includes(o.value));
      if (chosen.length === 0) block.lines.push('-Não informado.');
      else block.lines.push((q.type === 'checkbox' ? '+' : '-') + chosen.map((o) => o.label.replace(/\.$/, '')).join(' e ') + '.');
      for (const opt of chosen) {
        if (opt.input && !isEmpty(answers[opt.input.id])) {
          block.extras.push({ label: opt.input.label.replace(' (opcional)', ''), value: answers[opt.input.id] });
        }
      }
      blocks.push(block);
      for (const opt of chosen) if (opt.followUp) walk(opt.followUp);
    }
  };
  walk(form.questions);
  return blocks;
}
