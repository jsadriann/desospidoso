import { useNavigate } from 'react-router-dom';
import { Button, Screen, SectionTitle, TopBar } from '../components/ui.jsx';
import { IconCheckCircle, IconChevronRight, IconCircle } from '../components/Icons.jsx';

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
      <p>Cada arquivo aparece como um cartão com o nome do paciente, o ID, o status, o progresso, progresso visual e a informação da última alteração.</p>
      <div className="card help__card" aria-hidden="true">
        <div className="card__head">
          <span className="card__name">Nome completo do paciente</span>
          <span className="card__id">NÚMERO IDENTIFICADOR</span>
          <IconChevronRight size={22} />
        </div>
        <p className="status status--done">Status</p>
        <p className="card__line">Progresso</p>
        <p className="status status--done">Progresso visual</p>
        <p className="card__foot">Informação da última alteração</p>
      </div>

      <h2>Qual o significado para cada tipo de Status?</h2>
      <p><strong>Pendente para você:</strong> A sua parte do arquivo ainda não foi preenchida.</p>
      <p><strong>Pendente:</strong> Você ou alguém da mesma função já preencheu a seção dos dados específicos do paciente por função, mas os participantes das outras funções ainda não preencheram as deles.</p>
      <p><strong>Concluído:</strong> todas as seções foram preenchidas.</p>

      <h2>Como entender o progresso e o progresso visual?</h2>
      <p>
        Abaixo do status, o cartão mostra o progresso de quantas seções já foram concluídas (por exemplo, "3 de 7 seções
        concluídas") e uma indicação visual, que representa cada seção do arquivo do paciente por círculos. Cada círculo
        representa uma seção:
      </p>
      <p className="help__legend"><IconCheckCircle size={22} className="text-green" /> <span><strong>Círculo com check <span className="text-green">verde</span>:</strong> Seção preenchida.</span></p>
      <p className="help__legend"><IconCircle size={22} /> <span><strong>Círculo <span className="muted">vazio</span>:</strong> Seção ainda não preenchida.</span></p>
      <p><strong>Atenção:</strong> A identificação do paciente não aparece no progresso.</p>

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
