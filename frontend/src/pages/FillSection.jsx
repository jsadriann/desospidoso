import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { Actions, Button, ConfirmModal, ErrorText, Loading, Screen, SectionTitle, Stepper, TopBar } from '../components/ui.jsx';
import { IdentificationCard, ProfessionIcon, QuestionForm } from '../components/patient.jsx';
import { IconCheckCircle, IconDash } from '../components/Icons.jsx';
import { formatDate } from '../utils/format.js';

// Etapa 2: preencher (ou editar) os dados específicos do paciente da função do usuário logado.
export default function FillSection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, meta, notify } = useApp();
  const [patient, setPatient] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [details, setDetails] = useState([]);
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = meta?.forms.find((f) => f.role === user.role);

  useEffect(() => {
    api.patient(id).then(({ patient: p }) => {
      setPatient(p);
      const mine = p.sections.find((s) => s.role === user.role);
      if (mine?.answers) setAnswers(mine.answers);
    }).catch((e) => setError(e.message));
  }, [id, user.role]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api.saveSection(id, user.role, answers);
      notify('success');
      navigate(`/pacientes/${id}`, { replace: true });
    } catch (err) {
      setConfirm(false);
      setError(err.message);
      setDetails(err.details || []);
      notify('error');
    } finally {
      setSaving(false);
    }
  };

  if (!patient || !form) return <Screen narrow>{error ? <ErrorText>{error}</ErrorText> : <Loading />}</Screen>;
  const editingExisting = patient.myRoleDone;

  return (
    <Screen narrow>
      {!editingExisting && <Stepper step={2} />}
      <TopBar title="Preencher dados específicos do paciente por função" onBack={() => navigate(-1)} backTitle="Voltar sem salvar" />
      <p className="center small">Preencha os dados específicos do paciente abaixo</p>

      <SectionTitle icon={<IconCheckCircle className="text-green" />}>Identificação</SectionTitle>
      <div className="right"><Link className="link small" to={`/pacientes/${id}`} title="Ver todos os dados já preenchidos deste paciente">Detalhes</Link></div>
      <IdentificationCard patient={patient} footer={`Criado dia ${formatDate(patient.createdAt)}`} />

      <SectionTitle icon={<IconDash className="text-pending" />}>Dados específicos do paciente por função</SectionTitle>
      <div className="role-head">
        <ProfessionIcon icon={form.icon} />
        <h3>{form.title}</h3>
      </div>

      <form id="section-form" className="stack" onSubmit={(e) => { e.preventDefault(); setConfirm(true); }} noValidate>
        <QuestionForm questions={form.questions} answers={answers} onChange={setAnswers} />
        <ErrorText>{error}</ErrorText>
        {details.length > 0 && (
          <ul className="error-list">{details.map((d) => <li key={d}>{d}</li>)}</ul>
        )}
      </form>
      <Actions sticky>
        <Button type="submit" form="section-form" title="Salvar os dados da sua seção">Salvar</Button>
        <Button type="button" variant="outline" title="Descartar as alterações e voltar" onClick={() => navigate(-1)}>Cancelar</Button>
      </Actions>

      {confirm && (
        <ConfirmModal title="Salvar" confirmLabel="Sim, salvar" loading={saving} onConfirm={save} onClose={() => setConfirm(false)}>
          {editingExisting
            ? 'Tem certeza de que deseja salvar essa seção? Ao confirmar, a seção será atualizada.'
            : 'Tem certeza de que deseja salvar esse arquivo de paciente? Ao confirmar, a sua seção será registrada e o arquivo aparecerá atualizado na lista da página "Pacientes".'}
        </ConfirmModal>
      )}
    </Screen>
  );
}
