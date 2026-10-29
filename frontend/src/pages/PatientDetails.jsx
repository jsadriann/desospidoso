import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { useAsync } from '../hooks.js';
import { Button, ConfirmModal, ErrorText, Loading, Screen, TopBar } from '../components/ui.jsx';
import {
  IdentificationDetails, MissingRoles, ProfessionIcon, ProgressBar, RoleProgress, SectionAnswers, StatusTag,
} from '../components/patient.jsx';
import { IconRestore, IconTrash } from '../components/Icons.jsx';
import { createdLine } from '../utils/format.js';

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useApp();
  const { data, error, loading, setData } = useAsync(() => api.patient(id), [id]);
  const [modal, setModal] = useState(null); // 'delete' | 'restore'
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <Screen narrow><Loading /></Screen>;
  if (error) return <Screen narrow><TopBar title="Detalhes" /><ErrorText>{error.message}</ErrorText></Screen>;
  const p = data.patient;
  const trashed = !!p.deletedAt;

  const act = async () => {
    setBusy(true);
    try {
      const res = modal === 'delete' ? await api.deletePatient(id) : await api.restorePatient(id);
      setData(res);
      notify('success');
      setModal(null);
      if (modal === 'delete') navigate('/pacientes?aba=lixeira', { replace: true });
    } catch {
      notify('error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen narrow className="details">
      <TopBar
        title="Detalhes"
        onBack={() => navigate('/pacientes')}
        backTitle="Voltar para a lista de pacientes"
        right={trashed ? (
          <button className="icon-btn icon-btn--ring" aria-label="Restaurar" title="Restaurar este arquivo da lixeira" onClick={() => setModal('restore')}><IconRestore /></button>
        ) : (
          <button className="icon-btn icon-btn--ring" aria-label="Excluir" title="Mover este arquivo para a lixeira" onClick={() => setModal('delete')}><IconTrash /></button>
        )}
      />

      {/* Resumo: situação do arquivo e quais funções ainda faltam */}
      <section className="panel panel--summary" aria-label="Resumo do arquivo">
        <div className="panel__body">
          <div className="summary-head">
            <StatusTag status={p.status} />
            <span className="muted small">ID {p.code}</span>
          </div>
          <p className="summary-name">{p.fullName}</p>
          <ProgressBar done={p.sectionsDone} total={p.totalSections} status={p.status} />
          <RoleProgress progress={p.progress} size={34} />
          {p.pendingRoles.length
            ? <MissingRoles roles={p.pendingRoles} />
            : <p className="missing missing--done">Todas as funções preencheram a sua seção.</p>}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__head">Identificação</h2>
        <div className="panel__body">
          <p className="small">{createdLine(p.createdAt, p.createdByName)}</p>
          <IdentificationDetails patient={p} />
          <Button variant="outline" disabled={trashed} title={trashed ? 'Restaure o arquivo para poder editar' : 'Editar a identificação do paciente'} onClick={() => navigate(`/pacientes/${id}/identificacao`)}>Editar</Button>
        </div>
      </section>

      <h2 className="group-title">Dados específicos do paciente por função</h2>

      {p.sections.map((s) => (
        <section key={s.role} className={`panel ${s.done ? '' : 'panel--todo'}`}>
          <h3 className="panel__head panel__head--role">
            <ProfessionIcon icon={s.icon} size={36} />
            <span className="panel__title">{s.title}</span>
            <span className={`badge ${s.done ? 'badge--done' : 'badge--wait'}`}>{s.done ? 'Preenchida' : 'Falta preencher'}</span>
          </h3>
          <div className="panel__body">
            {s.done ? (
              <>
                <p className="small">{createdLine(s.updatedAt, s.filledByName, s.updatedAt !== s.createdAt ? 'Atualizado' : 'Criado')}</p>
                <SectionAnswers display={s.display} />
                {s.canEdit && <Button variant="outline" title="Editar a seção da sua função" onClick={() => navigate(`/pacientes/${id}/preencher`)}>Editar</Button>}
              </>
            ) : (
              <>
                <p className="muted small">Seção ainda não preenchida.</p>
                {s.canEdit && <Button title="Preencher os dados específicos da sua função" onClick={() => navigate(`/pacientes/${id}/preencher`)}>Preencher minha seção</Button>}
              </>
            )}
          </div>
        </section>
      ))}

      {modal === 'delete' && (
        <ConfirmModal title="Excluir" confirmLabel="Sim, excluir" loading={busy} onConfirm={act} onClose={() => setModal(null)}>
          Ao confirmar, o arquivo do paciente será movido para a lixeira. Ele poderá ser restaurado dentro de 30 dias.
          Durante esse período, a ficha não aparecerá na lista de fichas completas. Caso seja restaurada, voltará a ficar
          disponível normalmente.
        </ConfirmModal>
      )}
      {modal === 'restore' && (
        <ConfirmModal title="Restaurar" icon={<IconRestore size={22} />} confirmLabel="Sim, restaurar" loading={busy} onConfirm={act} onClose={() => setModal(null)}>
          Ao confirmar, o arquivo do paciente será restaurado, voltando a estar disponível na lista de arquivos e na opção
          da ficha completa.
        </ConfirmModal>
      )}
    </Screen>
  );
}
