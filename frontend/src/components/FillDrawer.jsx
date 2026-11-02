import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { Button, ConfirmModal, ErrorText, Loading } from './ui.jsx';
import { IconClose } from './Icons.jsx';
import { ProfessionIcon, QuestionForm } from './patient.jsx';

/**
 * Formulário da função do usuário aberto POR CIMA da lista de pacientes (botão "Preencher" do cartão).
 * Computador: janela no centro da tela, subindo de baixo para cima. Celular: folha que sobe de baixo.
 * A lista continua visível atrás. Ao salvar, o painel fecha e a lista é atualizada (onSaved).
 */
export default function FillDrawer({ patientId, onClose, onSaved }) {
  const { user, meta, notify } = useApp();
  const form = meta?.forms.find((f) => f.role === user.role);
  const [patient, setPatient] = useState(null);
  const [answers, setAnswers] = useState({});
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState([]);
  const [modal, setModal] = useState(null); // 'save' | 'discard'
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    api.patient(patientId).then(({ patient: p }) => {
      setPatient(p);
      const mine = p.sections.find((s) => s.role === user.role);
      if (mine?.answers) setAnswers(mine.answers);
    }).catch((e) => setError(e.message));
  }, [patientId, user.role]);

  // Trava a rolagem da página atrás e coloca o foco no painel
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);

  /** Fecha com a animação de saída. */
  const close = () => {
    setClosing(true);
    setTimeout(onClose, 220);
  };
  /** Pede confirmação antes de descartar o que já foi marcado. */
  const requestClose = () => (dirty ? setModal('discard') : close());

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !modal) requestClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const change = (next) => { setAnswers(next); setDirty(true); };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api.saveSection(patientId, user.role, answers);
      notify('success', 'Sua seção foi salva');
      setModal(null);
      onSaved?.();
      close();
    } catch (err) {
      setModal(null);
      setError(err.message);
      setDetails(err.details || []);
      notify('error');
      bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className={`drawer-backdrop ${closing ? 'is-closing' : ''}`}
      onMouseDown={(e) => e.target === e.currentTarget && requestClose()}
    >
      <aside
        ref={panelRef}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={form ? `Preencher: ${form.title}` : 'Preencher seção'}
        tabIndex={-1}
      >
        <span className="drawer__grip" aria-hidden="true" />
        <header className="drawer__head">
          {form && <ProfessionIcon icon={form.icon} size={44} />}
          <div className="drawer__titles">
            <h2 className="drawer__title">{form?.title || 'Preencher seção'}</h2>
            {patient && (
              <p className="drawer__sub">
                {patient.fullName} · ID {patient.code}
                {' · '}
                <Link className="link" to={`/pacientes/${patientId}`} title="Abrir todos os dados deste paciente">Ver detalhes</Link>
              </p>
            )}
          </div>
          <button type="button" className="icon-btn" aria-label="Fechar" title="Fechar o formulário" onClick={requestClose}>
            <IconClose />
          </button>
        </header>

        <div className="drawer__body" ref={bodyRef}>
          {!patient || !form ? (
            error ? <ErrorText>{error}</ErrorText> : <Loading count={1} />
          ) : (
            <form id="drawer-form" className="stack" onSubmit={(e) => { e.preventDefault(); setModal('save'); }} noValidate>
              <QuestionForm questions={form.questions} answers={answers} onChange={change} />
              <ErrorText>{error}</ErrorText>
              {details.length > 0 && <ul className="error-list">{details.map((d) => <li key={d}>{d}</li>)}</ul>}
            </form>
          )}
        </div>

        <footer className="drawer__foot">
          <Button type="button" variant="outline" title="Fechar sem salvar" onClick={requestClose}>Cancelar</Button>
          <Button type="submit" form="drawer-form" disabled={!patient || !form} title="Salvar os dados da sua seção">Salvar</Button>
        </footer>
      </aside>

      {modal === 'save' && (
        <ConfirmModal title="Salvar" confirmLabel="Sim, salvar" loading={saving} onConfirm={save} onClose={() => setModal(null)}>
          Tem certeza de que deseja salvar a sua seção? Ao confirmar, ela será registrada e o arquivo aparecerá atualizado
          na lista de pacientes.
        </ConfirmModal>
      )}
      {modal === 'discard' && (
        <ConfirmModal title="Descartar" confirmLabel="Sim, descartar" onConfirm={() => { setModal(null); close(); }} onClose={() => setModal(null)}>
          Você já marcou algumas respostas. Deseja fechar o formulário sem salvar?
        </ConfirmModal>
      )}
    </div>,
    document.body,
  );
}
