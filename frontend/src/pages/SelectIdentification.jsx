import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAsync, useDebounced } from '../hooks.js';
import { Actions, Button, ErrorText, Loading, Screen, SearchField, Stepper, Tabs, TopBar } from '../components/ui.jsx';
import { IdentificationCard } from '../components/patient.jsx';
import { formatDate } from '../utils/format.js';

// Etapa 1 do "+ Novo": escolher uma identificação existente (reutilização) ou criar uma nova.
export default function SelectIdentification() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('todos');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const q = useDebounced(query);
  const filter = tab === 'todos' ? 'selecionaveis' : 'selecionaveis_recentes';
  const { data, loading } = useAsync(() => api.patients(filter, q), [filter, q]);
  const patients = data?.patients || [];

  const next = () => {
    if (!selected) return setError('Selecione um paciente ou adicione uma nova identificação.');
    navigate(`/pacientes/${selected}/preencher`);
  };

  return (
    <Screen narrow>
      <Stepper step={1} />
      <TopBar title="Selecionar identificação de paciente" onBack={() => navigate('/pacientes')} backTitle="Voltar para a lista de pacientes" />
      <p className="center small">Selecione um paciente ou adicione um novo abaixo</p>
      <div className="stack">
        <SearchField value={query} onChange={setQuery} />
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: 'todos', label: 'Todos', title: 'Mostrar todas as identificações pendentes para a sua função' },
          { value: 'recentes', label: 'Recentes', title: 'Mostrar identificações criadas nos últimos 3 dias' },
        ]} />
        {loading && !data && <Loading />}
        {!loading && patients.length === 0 && (
          <p className="empty">
            {q ? 'Nenhuma identificação encontrada para essa pesquisa.' : 'Nenhuma identificação pendente para a sua função. Adicione uma nova identificação de paciente.'}
          </p>
        )}
        <div className="cards">
          {patients.map((p) => (
            <IdentificationCard
              key={p.id}
              patient={p}
              selectable
              selected={selected === p.id}
              onSelect={() => { setSelected(p.id); setError(''); }}
              footer={`Criado dia ${formatDate(p.createdAt)}`}
            />
          ))}
        </div>
        <ErrorText>{error}</ErrorText>
        <Actions>
          <Button onClick={next} title="Continuar com o paciente selecionado">Continuar</Button>
          <Button variant="outline" title="Cadastrar uma nova identificação de paciente" onClick={() => navigate('/pacientes/novo/identificacao')}>
            <span className="only-mobile">Adicionar nova identificação de paciente</span>
            <span className="only-wide">Nova identificação</span>
          </Button>
          <Button variant="outline" title="Cancelar e voltar para a lista de pacientes" onClick={() => navigate('/pacientes')}>Cancelar</Button>
        </Actions>
      </div>
    </Screen>
  );
}
