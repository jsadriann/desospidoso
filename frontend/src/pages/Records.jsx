import { useState } from 'react';
import { api } from '../api.js';
import { useAsync, useDebounced } from '../hooks.js';
import { BottomNav, ErrorText, InfoBanner, Loading, Screen, SearchField } from '../components/ui.jsx';
import { IdentificationCard } from '../components/patient.jsx';

export default function Records() {
  const [query, setQuery] = useState('');
  const q = useDebounced(query);
  const { data, loading, error } = useAsync(() => api.records(q), [q]);
  const records = data?.records || [];

  return (
    <Screen withNav>
      <header className="page-head"><h1>Fichas completas</h1></header>
      <div className="stack">
        <SearchField value={query} onChange={setQuery} />
        {loading && !data && <Loading />}
        {error && <ErrorText>{error.message}</ErrorText>}
        {!loading && !error && records.length === 0 && (q ? (
          <p className="empty">Nenhuma ficha encontrada para essa pesquisa.</p>
        ) : (
          <InfoBanner>
            No momento, não há nenhuma ficha disponível. Para acessá-las, é necessário que toda a equipe finalize o
            preenchimento dos dados, concluindo o arquivo do paciente.
          </InfoBanner>
        ))}
        <div className="cards">
          {records.map((r) => <IdentificationCard key={r.id} patient={r} to={`/fichas/${r.id}`} />)}
        </div>
      </div>
      <BottomNav />
    </Screen>
  );
}
