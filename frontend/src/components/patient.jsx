import { Link } from 'react-router-dom';
import { formatDate, lastActionLabel } from '../utils/format.js';
import {
  IconBed, IconBuilding, IconCalendar, IconCheck, IconCheckCircle, IconChevronRight, IconDash, IconDoor,
} from './Icons.jsx';
import { OptionCard, TextField } from './ui.jsx';

export const STATUS = {
  PENDENTE_PARA_VOCE: {
    label: 'Pendente para você', short: 'Pendentes para você', cls: 'mine', icon: <IconDash size={16} />,
    hint: 'A sua parte deste arquivo ainda não foi preenchida',
  },
  PENDENTE: {
    label: 'Pendente', short: 'Pendentes', cls: 'wait', icon: <IconDash size={16} />,
    hint: 'A sua função já preencheu; faltam as seções de outras funções',
  },
  CONCLUIDO: {
    label: 'Concluído', short: 'Concluídos', cls: 'done', icon: <IconCheckCircle size={16} />,
    hint: 'Todas as seções foram preenchidas',
  },
};

/** Etiqueta colorida do status (laranja: falta a sua parte; azul: falta de outras funções; verde: concluído). */
export function StatusTag({ status }) {
  const s = STATUS[status] || STATUS.PENDENTE;
  return <span className={`badge badge--${s.cls}`} title={s.hint}>{s.icon}{s.label}</span>;
}

/** "a, b e c" */
export const joinList = (items) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`);

/** Barra de progresso das seções (ex.: 5/7). */
export function ProgressBar({ done, total, status }) {
  const cls = (STATUS[status] || STATUS.PENDENTE).cls;
  return (
    <div className="progress" title={`${done} de ${total} seções concluídas`}>
      <span className="progress__track">
        <span className={`progress__fill progress__fill--${cls}`} style={{ width: `${(done / total) * 100}%` }} />
      </span>
      <span className="progress__count">{done}/{total}</span>
    </div>
  );
}

/** Ícone de cada função: colorido com check quando a seção foi preenchida, apagado quando ainda falta. */
export function RoleProgress({ progress, size = 30 }) {
  return (
    <ul className="roles" aria-label="Seções por função">
      {progress.map((p) => (
        <li
          key={p.role}
          className={`roles__item ${p.done ? 'is-done' : ''}`}
          title={`${p.label}: ${p.done ? 'seção preenchida' : 'falta preencher'}`}
          style={{ width: size, height: size }}
        >
          <img src={`/img/${p.icon}.png`} alt={`${p.label}: ${p.done ? 'preenchida' : 'falta preencher'}`} />
          {p.done && <span className="roles__check" aria-hidden="true"><IconCheck size={10} strokeWidth={3.5} /></span>}
        </li>
      ))}
    </ul>
  );
}

/** Texto do que falta. No cartão, até 3 funções aparecem pelo nome; acima disso, só a quantidade. */
export function MissingRoles({ roles, compact = false }) {
  if (!roles?.length) return null;
  const text = compact && roles.length > 3 ? `${roles.length} funções` : joinList(roles);
  return <p className="missing" title={`Falta preencher: ${joinList(roles)}`}><strong>Falta preencher:</strong> {text}</p>;
}

/** Cartão da lista "Pacientes": status em cor, progresso, funções e última alteração. */
export function PatientCard({ patient, to }) {
  const s = STATUS[patient.status] || STATUS.PENDENTE;
  return (
    <Link to={to} className={`group card card--link pcard pcard--${s.cls}`} title={`Abrir os detalhes de ${patient.fullName}`}>
      <div className="pcard__top">
        <StatusTag status={patient.status} />
        <span className="card__id">ID {patient.code}</span>
      </div>
      <div className="card__head">
        <span className="card__name pcard__name transition-colors duration-200 group-hover:text-brand-text">{patient.fullName}</span>
        <span className="inline-flex transition-transform duration-300 ease-out group-hover:translate-x-1">
          <IconChevronRight size={22} />
        </span>
      </div>
      <ProgressBar done={patient.sectionsDone} total={patient.totalSections} status={patient.status} />
      <RoleProgress progress={patient.progress} />
      {patient.pendingRoles.length
        ? <MissingRoles roles={patient.pendingRoles} compact />
        : <p className="missing missing--done">Todas as funções preencheram.</p>}
      <p className="card__foot">{lastActionLabel(patient.lastAction, patient.lastActionAt)}</p>
    </Link>
  );
}

/** Idade em anos a partir de "AAAA-MM-DD". */
export function ageFrom(birthDate) {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split('-').map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age;
}

/** Etiquetas do eixo de internação e da idade. */
function IdentTags({ patient }) {
  const age = ageFrom(patient.birthDate);
  return (
    <div className="rcard__tags">
      <span className="rcard__tag" title="Eixo de internação">{patient.axisLabel}</span>
      {age != null && <span className="rcard__tag" title="Idade">{age} anos</span>}
    </div>
  );
}

/** Nascimento, hospital, enfermaria e leito em grade, com ícone e rótulo. */
function IdentInfo({ patient }) {
  const info = [
    { icon: <IconCalendar size={16} />, label: 'Nascimento', value: formatDate(patient.birthDate) },
    { icon: <IconBuilding size={16} />, label: 'Hospital', value: patient.hospital },
    { icon: <IconDoor size={16} />, label: 'Enfermaria', value: patient.ward },
    { icon: <IconBed size={16} />, label: 'Leito', value: patient.bed },
  ];
  return (
    <dl className="rcard__info">
      {info.map((i) => (
        <div key={i.label} className="rcard__item">
          <dt>{i.icon}{i.label}</dt>
          <dd title={i.value}>{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Cartão da lista "Fichas completas": mesmo estilo do cartão de pacientes, com os dados da identificação. */
export function RecordCard({ patient, to }) {
  return (
    <Link to={to} className="group card card--link pcard pcard--done rcard" title={`Abrir a ficha de ${patient.fullName}`}>
      <div className="pcard__top">
        <span className="badge badge--done"><IconCheckCircle size={16} />Ficha completa</span>
        <span className="card__id">ID {patient.code}</span>
      </div>
      <div className="card__head">
        <span className="card__name pcard__name transition-colors duration-200 group-hover:text-brand-text">{patient.fullName}</span>
        <span className="inline-flex transition-transform duration-300 ease-out group-hover:translate-x-1">
          <IconChevronRight size={22} />
        </span>
      </div>
      <IdentTags patient={patient} />
      <IdentInfo patient={patient} />
      <RoleProgress progress={patient.progress} size={26} />
      <p className="card__foot">Ficha concluída dia {formatDate(patient.completedAt || patient.updatedAt)}</p>
    </Link>
  );
}

/**
 * Cartão com os dados da identificação, mais simples (sem status nem funções).
 * Usado no "+ Novo" (escolher o paciente) e no topo da tela de preenchimento.
 */
export function IdentificationCard({ patient, to, selectable, selected, onSelect, footer }) {
  const body = (
    <>
      <div className="card__head">
        {selectable && (
          <span className={`option__mark option__mark--radio ${selected ? 'is-on' : ''}`} aria-hidden="true" />
        )}
        <span className="card__name pcard__name">{patient.fullName}</span>
        <span className="card__id">ID {patient.code}</span>
        {to && (
          <span className="inline-flex transition-transform duration-300 ease-out group-hover:translate-x-1">
            <IconChevronRight size={22} />
          </span>
        )}
      </div>
      <IdentTags patient={patient} />
      <IdentInfo patient={patient} />
      <p className="card__foot">{footer ?? lastActionLabel(patient.lastAction, patient.lastActionAt)}</p>
    </>
  );
  if (to) return <Link to={to} className="group card card--link icard" title={`Abrir a ficha de ${patient.fullName}`}>{body}</Link>;
  if (selectable) {
    return (
      <button type="button" className={`card card--select icard ${selected ? 'is-selected' : ''}`} onClick={onSelect} aria-pressed={selected} title={`Selecionar ${patient.fullName} para preencher a sua seção`}>
        {body}
      </button>
    );
  }
  return <div className="card icard">{body}</div>;
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

/** Mesma regra do backend (forms.js): esconde a pergunta conforme outra resposta. */
const isHidden = (q, answers) => Boolean(q.hideIf && q.hideIf.anyOf.some((id) => answers[id] === q.hideIf.equals));

function Question({ q, answers, set, nested }) {
  if (isHidden(q, answers)) return null;
  if (q.type === 'group') {
    return (
      <fieldset className="q">
        <legend className="q__label">• {q.label}</legend>
        {q.requireAny && <p className="q__hint">Basta responder pelo menos um documento. Não é preciso responder todos.</p>}
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
  // Resposta antiga de uma opção só (quando a pergunta era de escolha única) vira lista
  const list = Array.isArray(current) ? current : current ? [current] : [];
  const isOn = (v) => (multi ? list.includes(v) : current === v);
  const toggle = (v) => {
    if (!multi) return set({ [q.id]: v });
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
