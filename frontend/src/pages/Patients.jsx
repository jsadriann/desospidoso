import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAsync, useDebounced } from '../hooks.js';
import { BottomNav, ErrorText, InfoBanner, Loading, Screen, SearchField, Tabs } from '../components/ui.jsx';
import { PatientCard } from '../components/patient.jsx';
import { IconHelp, IconPlus, IconTrash } from '../components/Icons.jsx';

const EMPTY = {
  todos: 'Nenhum paciente adicionado. Clique em + Novo para criar um novo registro de paciente.',
  recentes: 'Nenhum paciente adicionado nos últimos 3 dias. Clique em + Novo para criar um novo registro de paciente.',
  lixeira: 'Nenhum paciente excluído até o momento.',
};

export default function Patients() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = ['todos', 'recentes', 'lixeira'].includes(params.get('aba')) ? params.get('aba') : 'todos';
  const [query, setQuery] = useState('');
  const q = useDebounced(query);
  const { data, loading, error } = useAsync(() => api.patients(tab, q), [tab, q]);
  const patients = data?.patients || [];

  return (
    <Screen withNav className="screen--fab">
      <header className="page-head">
        <h1>Pacientes</h1>
        <Link to="/pacientes/ajuda" className="icon-btn" aria-label="Ajuda" title="Ajuda: como entender esta página"><IconHelp size={36} /></Link>
      </header>
      <div className="stack">
        <SearchField value={query} onChange={setQuery} />
        <Tabs
          value={tab}
          onChange={(v) => setParams(v === 'todos' ? {} : { aba: v }, { replace: true })}
          tabs={[
            { value: 'todos', label: 'Todos', title: 'Mostrar todos os arquivos de paciente' },
            { value: 'recentes', label: 'Recentes', title: 'Mostrar os pacientes adicionados nos últimos 3 dias' },
            { value: 'lixeira', label: 'Lixeira', icon: <IconTrash size={18} />, title: 'Mostrar os arquivos excluídos (podem ser restaurados por 30 dias)' },
          ]}
        />
        {tab === 'lixeira' && (
          <InfoBanner>
            <strong>Atenção:</strong> após 30 dias, todos os arquivos que não forem restaurados serão permanentemente excluídos.
          </InfoBanner>
        )}
        {loading && !data ? <Loading /> : null}
        {error && <ErrorText>{error.message}</ErrorText>}
        {!loading && !error && patients.length === 0 && (
          <p className="empty">{q ? 'Nenhum paciente encontrado para essa pesquisa.' : EMPTY[tab]}</p>
        )}
        <div className="cards">
          {patients.map((p) => <PatientCard key={p.id} patient={p} to={`/pacientes/${p.id}`} />)}
        </div>
      </div>
      <button className="fab" aria-label="Novo paciente" title="Criar um novo arquivo de paciente" onClick={() => navigate('/pacientes/novo')}>
        <IconPlus size={26} />
      </button>
      <BottomNav />
    </Screen>
  );
}
