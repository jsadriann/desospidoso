import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { useAsync, useCountUp, useDebounced } from '../hooks.js';
import { BottomNav, ConfirmModal, ErrorText, InfoBanner, Loading, Screen, SearchField, Tabs } from '../components/ui.jsx';
import { PatientCard, STATUS } from '../components/patient.jsx';
import FillDrawer from '../components/FillDrawer.jsx';
import { IconCheckSquare, IconHelp, IconPlus, IconRestore, IconTrash } from '../components/Icons.jsx';

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

/** Número do resumo: conta de 0 até o valor quando a lista carrega ou muda. */
function CountUp({ value }) {
  const n = useCountUp(value);
  return <span className="summary__num" aria-label={String(value)}>{n}</span>;
}

export default function Patients() {
  const navigate = useNavigate();
  const { meta, notify } = useApp();
  const [params, setParams] = useSearchParams();
  const tab = ['todos', 'recentes', 'lixeira'].includes(params.get('aba')) ? params.get('aba') : 'todos';
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(''); // '' = todos os status
  const [axis, setAxis] = useState('');
  const [sort, setSort] = useState('recente');
  const q = useDebounced(query);
  const { data, loading, error, reload } = useAsync(() => api.patients(tab, q), [tab, q]);
  const [filling, setFilling] = useState(null); // id do paciente com o formulário aberto por cima
  const [restoring, setRestoring] = useState(null); // paciente da lixeira aguardando confirmação
  const [busy, setBusy] = useState(false);

  const restore = async () => {
    setBusy(true);
    try {
      await api.restorePatient(restoring.id);
      notify('success', `${restoring.fullName} voltou para a lista de pacientes`);
      setRestoring(null);
      reload();
    } catch {
      notify('error');
    } finally {
      setBusy(false);
    }
  };
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
  // Lixeira: seleção de cartões para remover permanentemente
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [purgeOpen, setPurgeOpen] = useState(false);
  const stopSelecting = () => { setSelecting(false); setSelected(new Set()); };
  useEffect(() => { stopSelecting(); }, [tab]); // ao trocar de aba, sai do modo de seleção
  // Se a busca esconder cartões, eles saem da seleção (só remove o que está à vista)
  useEffect(() => {
    setSelected((cur) => {
      const visible = new Set(patients.map((p) => p.id));
      const next = new Set([...cur].filter((id) => visible.has(id)));
      return next.size === cur.size ? cur : next;
    });
  }, [patients]);
  const toggle = (p) => setSelected((cur) => {
    const next = new Set(cur);
    if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
    return next;
  });
  const allSelected = patients.length > 0 && patients.every((p) => selected.has(p.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(patients.map((p) => p.id)));

  const purge = async () => {
    setBusy(true);
    try {
      const { removed } = await api.purgePatients([...selected]);
      notify('success', `${removed} ${removed === 1 ? 'arquivo removido' : 'arquivos removidos'} permanentemente`);
      setPurgeOpen(false);
      stopSelecting();
      reload();
    } catch {
      notify('error');
    } finally {
      setBusy(false);
    }
  };

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
        {tab === 'lixeira' && all.length > 0 && (
          <div className="trash-toolbar">
            <span className="trash-toolbar__info">
              {selecting
                ? `${selected.size} de ${patients.length} ${patients.length === 1 ? 'selecionado' : 'selecionados'}`
                : `${all.length} ${all.length === 1 ? 'arquivo' : 'arquivos'} na lixeira`}
            </span>
            {selecting ? (
              <>
                <button type="button" className="link-btn" title={allSelected ? 'Desmarcar todos os cartões' : 'Marcar todos os cartões'} onClick={toggleAll}>
                  {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
                <button type="button" className="link-btn trash-toolbar__cancel" title="Sair do modo de seleção" onClick={stopSelecting}>Cancelar</button>
              </>
            ) : (
              <button type="button" className="btn btn--outline btn--sm" title="Marcar arquivos para remover permanentemente" onClick={() => setSelecting(true)}>
                <IconCheckSquare size={18} /> Selecionar
              </button>
            )}
          </div>
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
                  <CountUp value={counts[key]} />
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
          {patients.map((p) => (
            <PatientCard
              key={p.id}
              patient={p}
              to={`/pacientes/${p.id}`}
              onFill={() => setFilling(p.id)}
              onRestore={setRestoring}
              selecting={selecting}
              selected={selected.has(p.id)}
              onToggle={toggle}
            />
          ))}
        </div>
      </div>
      {selecting && (
        <div className="select-bar" role="region" aria-label="Ações da seleção">
          <span className="select-bar__count"><strong>{selected.size}</strong> {selected.size === 1 ? 'selecionado' : 'selecionados'}</span>
          <button
            type="button"
            className="btn btn--danger btn--sm"
            disabled={selected.size === 0}
            title={selected.size ? 'Apagar de vez os arquivos selecionados' : 'Selecione ao menos um cartão'}
            onClick={() => setPurgeOpen(true)}
          >
            <IconTrash size={18} /> Remover permanentemente
          </button>
        </div>
      )}
      {!selecting && <button className="fab" aria-label="Novo paciente" title="Criar um novo arquivo de paciente" onClick={() => navigate('/pacientes/novo')}>
        <IconPlus size={26} />
      </button>}
      <BottomNav />
      {filling && <FillDrawer patientId={filling} onClose={() => setFilling(null)} onSaved={reload} />}
      {purgeOpen && (
        <ConfirmModal title="Remover permanentemente" icon={<IconTrash size={22} />} confirmLabel="Sim, remover" loading={busy} onConfirm={purge} onClose={() => setPurgeOpen(false)}>
          {selected.size === 1 ? 'O arquivo selecionado será apagado' : `Os ${selected.size} arquivos selecionados serão apagados`} de vez,
          com todas as seções preenchidas. <strong>Esta ação não pode ser desfeita.</strong>
        </ConfirmModal>
      )}
      {restoring && (
        <ConfirmModal title="Restaurar" icon={<IconRestore size={22} />} confirmLabel="Sim, restaurar" loading={busy} onConfirm={restore} onClose={() => setRestoring(null)}>
          Ao confirmar, o arquivo de <strong>{restoring.fullName}</strong> será restaurado, voltando a estar disponível na
          lista de arquivos e na opção da ficha completa.
        </ConfirmModal>
      )}
    </Screen>
  );
}
