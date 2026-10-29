import { useNavigate } from 'react-router-dom';
import { Button, Screen, SectionTitle, TopBar } from '../components/ui.jsx';
import { IconChevronRight, IconDash } from '../components/Icons.jsx';
import { ProgressBar, RoleProgress } from '../components/patient.jsx';

// Exemplo para o cartão ilustrativo: 3 funções preenchidas
const EXAMPLE = [
  ['ASSISTENTE_SOCIAL', 'Assistente social', 'assistente-social', true],
  ['ENFERMEIRO', 'Enfermeiro', 'enfermeiro', true],
  ['FISIOTERAPEUTA', 'Fisioterapeuta', 'fisioterapeuta', true],
  ['MEDICO', 'Médico', 'medico', false],
  ['NUTRICIONISTA', 'Nutricionista', 'nutricionista', false],
  ['PSICOLOGO', 'Psicólogo / Psiquiatra', 'psicologo', false],
  ['TERAPEUTA_OCUPACIONAL', 'Terapeuta ocupacional', 'terapeuta-ocupacional', false],
].map(([role, label, icon, done]) => ({ role, label, icon, done }));

export default function Help() {
  const navigate = useNavigate();
  return (
    <Screen narrow className="help">
      <TopBar title="Ajuda" />
      <SectionTitle>Pacientes</SectionTitle>

      <h2>O que é essa página?</h2>
      <p><strong>Pacientes</strong> é a página onde você gerencia e acompanha o preenchimento dos arquivos de paciente.</p>

      <h2>O que é um arquivo de paciente?</h2>
      <p>
        Um arquivo de paciente é o composto advindo da identificação do paciente somada às perguntas específicas de cada
        área profissional. Cada profissional preenche a sua parte e, quando todas as partes estão completas, o arquivo
        de paciente fica concluído.
      </p>

      <h2>O que é uma identificação do paciente?</h2>
      <p>
        Identificação do paciente é a primeira seção necessária para a criação do arquivo do paciente. Ela é composta
        pelos dados básicos do paciente, incluindo o nome completo, data de nascimento, enfermaria, leito e um ID ou
        identificador gerado pelo sistema.
      </p>
      <p>
        Além disso, é relevante destacar que como o hospital é colaborativo, a identificação do paciente não precisa ser
        criada mais de uma vez: depois de cadastrada, pode ser reutilizada por todos os profissionais para concluir um
        arquivo do paciente e gerar uma ficha.
      </p>
      <p>Assim, cada profissional só preenche os dados específicos da sua área, sem repetir informações que já foram registradas.</p>

      <h2>Como ler cada cartão da lista?</h2>
      <p>Cada arquivo aparece como um cartão com o status, o ID, o nome do paciente, o progresso, as funções que já preencheram, o que falta preencher e a informação da última alteração.</p>
      <div className="card pcard pcard--mine help__card" aria-hidden="true">
        <div className="pcard__top">
          <span className="badge badge--mine"><IconDash size={16} />Status</span>
          <span className="card__id">NÚMERO IDENTIFICADOR</span>
        </div>
        <div className="card__head">
          <span className="card__name pcard__name">Nome completo do paciente</span>
          <IconChevronRight size={22} />
        </div>
        <ProgressBar done={3} total={7} status="PENDENTE_PARA_VOCE" />
        <RoleProgress progress={EXAMPLE} />
        <p className="missing"><strong>Falta preencher:</strong> funções que ainda não preencheram</p>
        <p className="card__foot">Informação da última alteração</p>
      </div>

      <h2>Qual o significado para cada tipo de Status?</h2>
      <p>A cor do status aparece na etiqueta, na faixa à esquerda do cartão e na barra de progresso.</p>
      <p className="help__legend"><span className="badge badge--mine">Laranja</span> <span><strong>Pendente para você:</strong> A sua parte do arquivo ainda não foi preenchida.</span></p>
      <p className="help__legend"><span className="badge badge--wait">Azul</span> <span><strong>Pendente:</strong> Você ou alguém da mesma função já preencheu a seção dos dados específicos do paciente por função, mas os participantes das outras funções ainda não preencheram as deles.</span></p>
      <p className="help__legend"><span className="badge badge--done">Verde</span> <span><strong>Concluído:</strong> todas as seções foram preenchidas.</span></p>

      <h2>Como entender o progresso?</h2>
      <p>
        A barra mostra quantas seções já foram concluídas (por exemplo, 3/7). Abaixo dela, cada função aparece com o seu
        ícone, e ao passar o mouse sobre um ícone aparece o nome da função:
      </p>
      <p className="help__legend"><RoleProgress progress={[EXAMPLE[0]]} /> <span><strong>Ícone colorido com check:</strong> seção preenchida.</span></p>
      <p className="help__legend"><RoleProgress progress={[EXAMPLE[6]]} /> <span><strong>Ícone apagado:</strong> seção ainda não preenchida.</span></p>
      <p>
        <strong>Falta preencher:</strong> mostra quais funções ainda não preencheram a sua seção. No cartão aparecem os
        nomes quando faltam até 4 funções; acima disso, aparece a quantidade. A lista completa fica no resumo, no topo da
        tela de detalhes do paciente.
      </p>
      <p><strong>Atenção:</strong> A identificação do paciente não aparece no progresso.</p>

      <h2>Como usar o resumo e os filtros?</h2>
      <p>
        Acima dos cartões, o resumo mostra quantos arquivos há em cada status. Clique em um dos quadros para ver apenas os
        arquivos daquele status e clique de novo para ver todos. Também é possível filtrar pelo eixo de internação e
        escolher a ordem dos cartões: alteração mais recente, alteração mais antiga, nome ou menos seções preenchidas.
      </p>

      <h2>Como entender a informação da última alteração?</h2>
      <p>O texto no canto inferior direito do cartão corresponde à última alteração ou momento do arquivo do paciente, que pode variar dependendo da última ação do participante:</p>
      <p><strong>Criado dia xx/xx/xxxx:</strong> Quando o paciente foi criado há 3 dias atrás ou mais.</p>
      <p><strong>Criado hoje/ontem/anteontem:</strong> Quando o paciente foi criado no mesmo dia (hoje) ou em 2 dias atrás (ontem, anteontem).</p>
      <p><strong>Atualizado dia xx/xx/xxxx:</strong> Quando o arquivo foi editado há há um dia antes de anteontem depois de criado.</p>
      <p><strong>Atualizado hoje/ontem/anteontem:</strong> Quando o arquivo foi editado no mesmo dia (hoje) ou em 2 dias atrás depois de criado (ontem, anteontem).</p>
      <p><strong>Restaurado dia xx/xx/xxxx:</strong> Quando o arquivo foi restaurado da lixeira há um dia antes de anteontem depois de excluído.</p>
      <p><strong>Restaurado hoje/ontem/anteontem:</strong> Quando o arquivo foi restaurado da lixeira no mesmo dia (hoje) ou em 2 dias atrás (ontem, anteontem) depois de excluído.</p>
      <p><strong>Excluído dia xx/xx/xxxx:</strong> Quando o arquivo foi excluído da lista de arquivos de paciente há um dia antes de anteontem depois de criado e/ou atualizado.</p>
      <p><strong>Excluído hoje/ontem/anteontem:</strong> Quando o arquivo foi excluído da lista de arquivos de paciente no mesmo dia (hoje) ou em 2 dias atrás (ontem, anteontem) depois de criado e/ou atualizado.</p>

      <Button variant="outline" title="Voltar para a lista de pacientes" onClick={() => navigate('/pacientes')}>Voltar</Button>
    </Screen>
  );
}
