import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { useAsync } from '../hooks.js';
import { Actions, Button, ErrorText, Loading, Screen, SectionTitle, TopBar } from '../components/ui.jsx';
import { IdentificationDetails, ProfessionIcon, SectionAnswers } from '../components/patient.jsx';
import { IconCheckCircle } from '../components/Icons.jsx';
import { createdLine, formatDate } from '../utils/format.js';

export default function RecordDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useApp();
  const { data, error, loading } = useAsync(() => api.patient(id), [id]);
  const [downloading, setDownloading] = useState(false);

  if (loading && !data) return <Screen narrow><Loading /></Screen>;
  if (error) return <Screen narrow><TopBar title="Detalhes da ficha" /><ErrorText>{error.message}</ErrorText></Screen>;
  const p = data.patient;

  const download = async () => {
    setDownloading(true);
    try {
      await api.downloadPdf(id);
      notify('success');
    } catch {
      notify('error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Screen narrow className="details">
      <TopBar title="Detalhes da ficha" onBack={() => navigate('/fichas')} backTitle="Voltar para as fichas completas" />
      <p className="muted small">Ficha concluída dia {formatDate(p.completedAt || p.updatedAt)}</p>

      <SectionTitle icon={<IconCheckCircle className="text-green" />}>Identificação</SectionTitle>
      <p className="small">{createdLine(p.createdAt, p.createdByName)}</p>
      <IdentificationDetails patient={p} />

      <SectionTitle icon={<IconCheckCircle className="text-green" />}>Dados específicos do paciente por função</SectionTitle>
      {p.sections.map((s) => (
        <section key={s.role} className="role-section">
          <div className="role-head">
            <ProfessionIcon icon={s.icon} size={44} />
            <h3>{s.title}</h3>
          </div>
          <p className="small">{createdLine(s.updatedAt, s.filledByName, s.updatedAt !== s.createdAt ? 'Atualizado' : 'Criado')}</p>
          <SectionAnswers display={s.display} />
        </section>
      ))}

      <div className="stack">
        <Actions>
          <Button onClick={download} loading={downloading} title="Baixar a ficha completa em PDF">Download em PDF</Button>
          <Button variant="outline" title="Voltar para as fichas completas" onClick={() => navigate('/fichas')}>Voltar</Button>
        </Actions>
      </div>
    </Screen>
  );
}
