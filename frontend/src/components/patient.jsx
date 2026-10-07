import { Link } from 'react-router-dom';
import { formatDate, lastActionLabel } from '../utils/format.js';
import { IconCheckCircle, IconChevronRight, IconCircle, IconDash } from './Icons.jsx';
import { OptionCard, TextField } from './ui.jsx';
import { useApp } from '../context/AppContext.jsx';

const STATUS = {
  PENDENTE_PARA_VOCE: {
    label: 'Pendente para você', cls: 'status--pending', icon: <IconDash size={18} />,
    hint: 'A sua parte deste arquivo ainda não foi preenchida',
  },
  PENDENTE: {
    label: 'Pendente', cls: 'status--pending', icon: <IconDash size={18} />,
    hint: 'A sua função já preencheu; faltam as seções de outras funções',
  },
  CONCLUIDO: {
    label: 'Concluído', cls: 'status--done', icon: <IconCheckCircle size={18} />,
    hint: 'Todas as seções foram preenchidas',
  },
};

export function StatusTag({ status }) {
  const s = STATUS[status] || STATUS.PENDENTE;
  return <p className={`status ${s.cls}`} title={s.hint}>{s.icon}{s.label}</p>;
}

/** Um círculo por seção; ao passar o mouse mostra a função e se já foi preenchida. */
export function ProgressDots({ progress }) {
  const { meta } = useApp();
  return (
    <div className="dots" aria-hidden="true">
      {progress.map((p) => (
        <span key={p.role} className="dot-wrap" title={`${meta?.roles?.[p.role] || p.role}: ${p.done ? 'seção preenchida' : 'seção ainda não preenchida'}`}>
          {p.done ? <IconCheckCircle size={20} className="dot dot--done" /> : <IconCircle size={20} className="dot" />}
        </span>
      ))}
    </div>
  );
}

/** Cartão da lista "Pacientes" (status, progresso e última alteração). */
export function PatientCard({ patient, to }) {
  return (
    <Link to={to} className="card card--link" title={`Abrir os detalhes de ${patient.fullName}`}>
      <div className="card__head">
        <span className="card__name">{patient.fullName}</span>
        <span className="card__id">ID {patient.code}</span>
        <IconChevronRight size={22} />
      </div>
      <StatusTag status={patient.status} />
      <p className="card__line">{patient.sectionsDone} de {patient.totalSections} seções concluídas</p>
      <ProgressDots progress={patient.progress} />
      <p className="card__foot">{lastActionLabel(patient.lastAction, patient.lastActionAt)}</p>
    </Link>
  );
}

/** Cartão com dados da identificação (Fichas completas / Etapa 2 / seleção). */
export function IdentificationCard({ patient, to, selectable, selected, onSelect, footer }) {
  const body = (
    <>
      <div className="card__head">
        {selectable && (
          <span className={`option__mark option__mark--radio ${selected ? 'is-on' : ''}`} aria-hidden="true" />
        )}
        <span className="card__name">{patient.fullName}</span>
        <span className="card__id">ID {patient.code}</span>
        {to && <IconChevronRight size={22} />}
      </div>
      <ul className="card__list">
        <li>{formatDate(patient.birthDate)}</li>
        <li>{patient.hospital}</li>
        <li>{patient.ward}</li>
        <li>{patient.bed}</li>
        <li>{patient.axisLabel}</li>
      </ul>
      <p className="card__foot">{footer ?? lastActionLabel(patient.lastAction, patient.lastActionAt)}</p>
    </>
  );
  if (to) return <Link to={to} className="card card--link" title={`Abrir a ficha de ${patient.fullName}`}>{body}</Link>;
  if (selectable) {
    return (
      <button type="button" className={`card card--select ${selected ? 'is-selected' : ''}`} onClick={onSelect} aria-pressed={selected} title={`Selecionar ${patient.fullName} para preencher a sua seção`}>
        {body}
      </button>
    );
  }
  return <div className="card">{body}</div>;
}

/** Lista "rótulo: valor" da identificação. */
export function IdentificationDetails({ patient, showAxis = true }) {
  const rows = [
    ['Nome completo', patient.fullName],
    ['Data de nascimento', formatDate(patient.birthDate)],
    ['Hospital', patient.hospital],
    ['Enfermaria', patient.ward],
    ['Leito', patient.bed],
  ];
  if (showAxis) rows.push(['Eixo de internação', patient.axisLabel]);
  return (
    <dl className="kv">
      <p className="muted">ID {patient.code}</p>
      {rows.map(([k, v]) => (
        <div key={k} className="kv__row"><dt>{k}:</dt><dd>{v}</dd></div>
      ))}
    </dl>
  );
}

export function ProfessionIcon({ icon, size = 56 }) {
  return <img className="profession-icon" src={`/img/${icon}.png`} alt="" width={size} height={size} />;
}

/** Respostas de uma seção, no formato "-Sim." das telas de detalhes. */
export function SectionAnswers({ display }) {
  return (
    <div className="answers">
      {display.map((b, i) => (
        <div key={i} className={b.subtitle ? 'answers__sub' : 'answers__block'}>
          {b.question && <p className="answers__q">• {b.question}</p>}
          {b.subtitle && <p className="answers__subtitle">{b.subtitle}</p>}
          {b.lines.map((l, j) => <p key={j} className="answers__a">{l}</p>)}
          {b.extras.map((e, j) => (
            <div key={`e${j}`} className="answers__extra">
              <span>{e.label}:</span>
              <p>{e.value}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Formulário dinâmico de uma seção (gerado a partir de GET /api/forms).
 * answers: objeto { idPergunta: valor }, onChange(novoObjeto)
 */
export function QuestionForm({ questions, answers, onChange }) {
  const set = (patch) => onChange({ ...answers, ...patch });
  return (
    <div className="qform">
      {questions.map((q) => <Question key={q.id} q={q} answers={answers} set={set} />)}
    </div>
  );
}

function Question({ q, answers, set, nested }) {
  if (q.type === 'group') {
    return (
      <fieldset className="q">
        <legend className="q__label">• {q.label}</legend>
        {q.items.map((item) => (
          <div key={item.id} className="q__group">
            <p className="q__sublabel">{item.label}</p>
            <Options q={item} answers={answers} set={set} />
          </div>
        ))}
      </fieldset>
    );
  }
  if (q.type === 'text') {
    return (
      <div className="q">
        <p className="q__label">• {q.label}</p>
        <TextField
          label={q.inputLabel}
          value={answers[q.id] || ''}
          onChange={(e) => set({ [q.id]: e.target.value })}
        />
      </div>
    );
  }
  return (
    <fieldset className={`q ${nested ? 'q--nested' : ''}`}>
      <legend className="q__label">• {q.label}</legend>
      <Options q={q} answers={answers} set={set} />
    </fieldset>
  );
}

function Options({ q, answers, set }) {
  const multi = q.type === 'checkbox';
  const current = answers[q.id];
  const isOn = (v) => (multi ? (current || []).includes(v) : current === v);
  const toggle = (v) => {
    if (!multi) return set({ [q.id]: v });
    const list = current || [];
    set({ [q.id]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] });
  };
  return (
    <div className="options">
      {q.options.map((o) => (
        <div key={o.value}>
          <OptionCard type={multi ? 'checkbox' : 'radio'} name={q.id} checked={isOn(o.value)} onChange={() => toggle(o.value)} label={o.label}>
            {o.input && isOn(o.value) && (
              <TextField
                label={o.input.label}
                placeholder={o.input.placeholder}
                value={answers[o.input.id] || ''}
                onChange={(e) => set({ [o.input.id]: e.target.value })}
              />
            )}
          </OptionCard>
          {o.followUp && isOn(o.value) && o.followUp.map((f) => <Question key={f.id} q={f} answers={answers} set={set} nested />)}
        </div>
      ))}
    </div>
  );
}

/** Campos da identificação do paciente (nova e edição). */
export function IdentificationFields({ value, onChange, axes }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  return (
    <>
      <TextField label="Nome completo" placeholder="Leia Marinho" value={value.fullName} onChange={set('fullName')} />
      <TextField label="Data de nascimento" type="date" value={value.birthDate} onChange={set('birthDate')} max={new Date().toISOString().slice(0, 10)} />
      <TextField label="Hospital" placeholder="Hospital São José" value={value.hospital} onChange={set('hospital')} />
      <TextField label="Enfermaria" placeholder="Enfermaria 03" value={value.ward} onChange={set('ward')} />
      <TextField label="Leito" placeholder="Leito 08" value={value.bed} onChange={set('bed')} />
      <fieldset className="field">
        <legend className="field__label">Eixo de internação</legend>
        <div className="options options--grid">
          {Object.entries(axes || {}).map(([k, label]) => (
            <OptionCard key={k} name="axis" checked={value.axis === k} onChange={() => onChange({ ...value, axis: k })} label={`${label}.`} />
          ))}
        </div>
      </fieldset>
    </>
  );
}
