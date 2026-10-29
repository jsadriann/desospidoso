import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { useAsync, useDebounced } from '../hooks.js';
import { BottomNav, ErrorText, InfoBanner, Loading, Screen, SearchField, Tabs } from '../components/ui.jsx';
import { PatientCard, STATUS } from '../components/patient.jsx';
import { IconHelp, IconPlus, IconTrash } from '../components/Icons.jsx';

const EMPTY = {
  todos: 'Nenhum paciente adicionado. Clique em + Novo para criar um novo registro de paciente.',
  recentes: 'Nenhum paciente adicionado nos últimos 3 dias. Clique em + Novo para criar um novo registro de paciente.',
  lixeira: 'Nenhum paciente excluído até o momento.',
};

const SORTS = {
  recente: { label: 'Alteração mais recente', fn: (a, b) => b.lastActionAt.localeCompare(a.lastActionAt) },
  antiga: { label: 'Alteração mais antiga', fn: (a, b) => a.lastActionAt.localeCompare(b.lastActionAt) },
  nome: { label: 'Nome (A–Z)', fn: (a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR') },
  progresso: { label: 'Menos seções preenchidas', fn: (a, b) => a.sectionsDone - b.sectionsDone },
};

export default function Patients() {
  const navigate = useNavigate();
  const { meta } = useApp();
  const [params, setParams] = useSearchParams();
  const tab = ['todos', 'recentes', 'lixeira'].includes(params.get('aba')) ? params.get('aba') : 'todos';
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(''); // '' = todos os status
  const [axis, setAxis] = useState('');
  const [sort, setSort] = useState('recente');
  const q = useDebounced(query);
  const { data, loading, error } = useAsync(() => api.patients(tab, q), [tab, q]);
  const all = data?.patients || [];

  // Resumo: quantos arquivos há em cada status (respeitando o filtro de eixo)
  const byAxis = useMemo(() => all.filter((p) => !axis || p.axis === axis), [all, axis]);
  const counts = useMemo(() => {
    const c = { PENDENTE_PARA_VOCE: 0, PENDENTE: 0, CONCLUIDO: 0 };
    byAxis.forEach((p) => { c[p.status] += 1; });
    return c;
  }, [byAxis]);
  const patients = useMemo(
    () => byAxis.filter((p) => !status || p.status === status).sort(SORTS[sort].fn),
    [byAxis, status, sort],
  );
  const filtered = Boolean(status || axis);
  const clearFilters = () => { setStatus(''); setAxis(''); };

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

        {tab !== 'lixeira' && all.length > 0 && (
          <>
            {/* Resumo por status: cada quadro também filtra a lista */}
            <div className="summary" role="group" aria-label="Resumo por status">
              {Object.entries(STATUS).map(([key, s]) => (
                <button
                  key={key}
                  type="button"
                  className={`summary__item summary__item--${s.cls} ${status === key ? 'is-active' : ''}`}
                  aria-pressed={status === key}
                  title={status === key ? 'Mostrar todos os status' : `Mostrar só: ${s.short.toLowerCase()}`}
                  onClick={() => setStatus(status === key ? '' : key)}
                >
                  <span className="summary__num">{counts[key]}</span>
                  <span className="summary__label">{s.short}</span>
                </button>
              ))}
            </div>

            <div className="filters">
              <label className="filters__field">
                <span>Eixo</span>
                <select value={axis} onChange={(e) => setAxis(e.target.value)} title="Filtrar pelo eixo de internação">
                  <option value="">Todos os eixos</option>
                  {Object.entries(meta?.axes || {}).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </select>
              </label>
              <label className="filters__field">
                <span>Ordenar por</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)} title="Escolher a ordem dos cartões">
                  {Object.entries(SORTS).map(([k, o]) => <option key={k} value={k}>{o.label}</option>)}
                </select>
              </label>
              {filtered && (
                <button type="button" className="link-btn filters__clear" title="Mostrar todos os pacientes" onClick={clearFilters}>
                  Limpar filtros
                </button>
              )}
            </div>
          </>
        )}

        {loading && !data ? <Loading /> : null}
        {error && <ErrorText>{error.message}</ErrorText>}
        {!loading && !error && all.length === 0 && (
          <p className="empty">{q ? 'Nenhum paciente encontrado para essa pesquisa.' : EMPTY[tab]}</p>
        )}
        {!loading && !error && all.length > 0 && patients.length === 0 && (
          <p className="empty">Nenhum paciente com esses filtros.</p>
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
