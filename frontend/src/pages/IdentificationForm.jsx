import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { Actions, Button, ConfirmModal, ErrorText, Loading, Screen, Stepper, TopBar } from '../components/ui.jsx';
import { IdentificationFields } from '../components/patient.jsx';

const EMPTY = { fullName: '', birthDate: '', hospital: '', ward: '', bed: '', axis: '' };

// Nova identificação (Etapa 1) ou edição da identificação de um paciente existente.
export default function IdentificationForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const { meta, notify } = useApp();
  const [form, setForm] = useState(EMPTY);
  const [loaded, setLoaded] = useState(!editing);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.patient(id).then(({ patient: p }) => {
      setForm({ fullName: p.fullName, birthDate: p.birthDate, hospital: p.hospital, ward: p.ward, bed: p.bed, axis: p.axis });
      setLoaded(true);
    }).catch((e) => setError(e.message));
  }, [id, editing]);

  const ask = (e) => {
    e.preventDefault();
    setError('');
    if (Object.values(form).some((v) => !String(v).trim())) return setError('Por favor, preencha todos os campos antes de continuar.');
    setConfirm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api.updatePatient(id, form);
        notify('success');
        navigate(`/pacientes/${id}`, { replace: true });
      } else {
        const { patient } = await api.createPatient(form);
        notify('success');
        navigate(`/pacientes/${patient.id}/preencher`, { replace: true });
      }
    } catch (err) {
      setConfirm(false);
      setError(err.message);
      notify('error');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <Screen narrow>{error ? <ErrorText>{error}</ErrorText> : <Loading />}</Screen>;

  return (
    <Screen narrow>
      {!editing && <Stepper step={1} />}
      <TopBar title={editing ? 'Editar identificação do paciente' : 'Adicionar nova identificação de paciente'} />
      <p className="center small">Preencha os dados da identificação do paciente</p>
      <form id="identification-form" className="stack" onSubmit={ask} noValidate>
        <IdentificationFields value={form} onChange={setForm} axes={meta?.axes} />
        <ErrorText>{error}</ErrorText>
      </form>
      <Actions sticky>
        <Button type="submit" form="identification-form" title="Salvar a identificação do paciente">Salvar</Button>
        <Button type="button" variant="outline" title="Descartar e voltar" onClick={() => navigate(-1)}>Cancelar</Button>
      </Actions>
      {confirm && (
        <ConfirmModal title="Salvar" confirmLabel="Sim, salvar" loading={saving} onConfirm={save} onClose={() => setConfirm(false)}>
          {editing
            ? 'Tem certeza de que deseja salvar essa seção? Ao confirmar, a seção será atualizada.'
            : 'Tem certeza de que deseja salvar esse arquivo de paciente? Ao confirmar, a identificação do paciente ficará disponível para reutilização e o arquivo gerado aparecerá na lista da página "Pacientes".'}
        </ConfirmModal>
      )}
    </Screen>
  );
}
