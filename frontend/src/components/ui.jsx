import { useEffect, useId, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { apiUrl } from '../api.js';
import {
  IconAlert, IconArrowLeft, IconCheckCircle, IconClipboard, IconClose, IconEye, IconEyeOff, IconFile, IconInfo,
  IconChevronLeft, IconChevronRight, IconPlus, IconSearch, IconUser,
} from './Icons.jsx';

/** Extrai o texto de um conteúdo React (usado como dica padrão ao passar o mouse). */
export function textOf(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(' ').replace(/\s+/g, ' ').trim();
  if (node.props) {
    // Em botões com texto curto/longo (only-mobile / only-wide), usa só a versão longa
    if (node.props.className === 'only-wide') return '';
    return textOf(node.props.children);
  }
  return '';
}

export function Logo({ size = 'lg' }) {
  // Duas versões: a CSS mostra a escura no tema claro e a clara no tema escuro.
  return (
    <>
      <img className={`logo logo--${size} logo--on-light`} src="/logo.svg" alt="DesospIdoso" />
      <img className={`logo logo--${size} logo--on-dark`} src="/logo-dark.svg" alt="DesospIdoso" />
    </>
  );
}

/**
 * Área de conteúdo de uma tela.
 * withNav: reserva espaço para a barra inferior (só no celular).
 * narrow: limita a largura em telas grandes (formulários e leitura).
 */
export function Screen({ children, className = '', withNav = false, narrow = false }) {
  return (
    <main className={`screen ${withNav ? 'screen--nav' : ''} ${narrow ? 'screen--narrow' : ''} ${className}`}>
      {children}
    </main>
  );
}

const NAV_ITEMS = [
  { to: '/pacientes', label: 'Pacientes', icon: <IconFile />, hint: 'Ver a lista de pacientes e o andamento de cada arquivo' },
  { to: '/fichas', label: 'Fichas completas', icon: <IconClipboard />, hint: 'Ver as fichas já concluídas por toda a equipe' },
  { to: '/perfil', label: 'Perfil', icon: <IconUser />, hint: 'Ver e editar seus dados e sua conta' },
];

/**
 * Menu lateral (telas a partir de 1024px). No celular fica oculto e entra a BottomNav.
 * collapsed: mostra só os ícones (o nome aparece ao passar o mouse).
 */
export function SideNav({ collapsed = false, onToggle }) {
  const { user } = useApp();
  const navigate = useNavigate();
  const toggleLabel = collapsed ? 'Expandir menu' : 'Mostrar só os ícones';
  return (
    <aside className={`side-nav ${collapsed ? 'side-nav--collapsed' : ''}`} aria-label="Menu">
      {/* Seta redonda presa na divisória entre o menu e o conteúdo */}
      <button
        type="button"
        className="side-nav__toggle"
        aria-label={toggleLabel}
        aria-expanded={!collapsed}
        title={toggleLabel}
        onClick={onToggle}
      >
        {collapsed ? <IconChevronRight size={16} strokeWidth={2.5} /> : <IconChevronLeft size={16} strokeWidth={2.5} />}
      </button>
      <div className="side-nav__top">
        {collapsed
          ? <img className="side-nav__mark" src="/favicon.svg" alt="DesospIdoso" width="36" height="36" />
          : <div className="side-nav__logo"><Logo size="md" /></div>}
      </div>
      <button
        className="btn btn--primary side-nav__new"
        title="Criar um novo arquivo de paciente"
        aria-label="Novo paciente"
        onClick={() => navigate('/pacientes/novo')}
      >
        <IconPlus size={20} /> <span className="side-nav__label">Novo paciente</span>
      </button>
      <nav className="side-nav__links">
        {NAV_ITEMS.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            title={collapsed ? i.label : i.hint}
            aria-label={i.label}
            className={({ isActive }) => `side-nav__item ${isActive ? 'is-active' : ''}`}
          >
            {i.icon}
            <span className="side-nav__label">{i.label}</span>
          </NavLink>
        ))}
      </nav>
      {user && (
        <NavLink to="/perfil" className="side-nav__user" title={collapsed ? `${user.name} (abrir perfil)` : 'Abrir o seu perfil'}>
          <Avatar src={user.avatar} size={40} />
          <span className="side-nav__label">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </span>
        </NavLink>
      )}
    </aside>
  );
}

/** Telas de acesso (login, cadastro, senha): independentes da tela de primeiro acesso.
 *  No celular ocupam a tela toda; em telas maiores viram um cartão centralizado. */
export function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__card">{children}</div>
    </div>
  );
}

/** Cabeçalho com seta de voltar e título centralizado. */
export function TopBar({ title, onBack, right, backTitle = 'Voltar para a tela anterior' }) {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <button type="button" className="icon-btn" aria-label="Voltar" title={backTitle} onClick={onBack || (() => navigate(-1))}>
        <IconArrowLeft />
      </button>
      <h1 className="topbar__title">{title}</h1>
      <div className="topbar__right">{right}</div>
    </header>
  );
}

/** Botão padrão. Sem `title`, a dica ao passar o mouse é o próprio texto do botão. */
export function Button({ variant = 'primary', className = '', loading, children, title, ...rest }) {
  return (
    <button
      className={`btn btn--${variant} ${className}`}
      disabled={loading || rest.disabled}
      title={title ?? textOf(children)}
      {...rest}
    >
      {loading ? 'Aguarde...' : children}
    </button>
  );
}

/**
 * Barra de ações de formulário. Coloque os botões em ordem de importância (principal primeiro).
 * Celular: empilhados em largura total. Tablet/desktop: em linha, principal à direita e o último
 * (Cancelar/Voltar) à esquerda. sticky: fica presa no rodapé em formulários longos.
 */
export function Actions({ children, sticky = false }) {
  return <div className={`actions ${sticky ? 'actions--sticky' : ''}`}>{children}</div>;
}

export function Field({ label, children, htmlFor }) {
  return (
    <div className="field">
      {label && <label className="field__label" htmlFor={htmlFor}>{label}</label>}
      {children}
    </div>
  );
}

export function TextField({ label, id, invalid, ...rest }) {
  const auto = useId();
  const fid = id || auto;
  return (
    <Field label={label} htmlFor={fid}>
      <input id={fid} className={`input ${invalid ? 'input--invalid' : ''}`} {...rest} />
    </Field>
  );
}

export function PasswordField({ label, id, invalid, showToggle = true, ...rest }) {
  const auto = useId();
  const fid = id || auto;
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} htmlFor={fid}>
      <div className="input-wrap">
        <input id={fid} type={visible ? 'text' : 'password'} className={`input ${invalid ? 'input--invalid' : ''}`} {...rest} />
        {showToggle && (
          <button
            type="button"
            className="input-wrap__btn"
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            title={visible ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <IconEyeOff size={22} /> : <IconEye size={22} />}
          </button>
        )}
      </div>
    </Field>
  );
}

export function SearchField({ value, onChange, placeholder = 'pesquisar nome completo do paciente, ID' }) {
  return (
    <div className="input-wrap search">
      <input
        className="input"
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label="Pesquisar paciente"
        title="Pesquise pelo nome completo ou pelo ID do paciente"
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="input-wrap__btn" aria-hidden="true"><IconSearch size={22} /></span>
    </div>
  );
}

/** Opção em cartão (radio ou checkbox), como nas telas de cadastro e questionários. */
export function OptionCard({ type = 'radio', name, checked, onChange, label, children }) {
  return (
    <div className={`option ${checked ? 'option--checked' : ''}`}>
      <label className="option__row" title={typeof label === 'string' ? `Selecionar: ${label.replace(/\.$/, '')}` : undefined}>
        <input type={type} name={name} checked={checked} onChange={onChange} />
        <span className={`option__mark option__mark--${type}`} aria-hidden="true" />
        <span className="option__label">{label}</span>
      </label>
      {children && <div className="option__extra">{children}</div>}
    </div>
  );
}

export function SectionTitle({ children, icon }) {
  return (
    <h2 className="section-title">
      {icon}
      <span>{children}</span>
    </h2>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return (
    <p className="error-text" role="alert">
      <IconAlert size={20} />
      <span><strong>Erro:</strong> {children}</span>
    </p>
  );
}

export function InfoBanner({ children }) {
  return (
    <div className="info-banner" role="status">
      <IconInfo size={30} />
      <p>{children}</p>
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          className={`tab ${value === t.value ? 'tab--active' : ''}`}
          title={t.title || `Mostrar: ${t.label}`}
          onClick={() => onChange(t.value)}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({ step }) {
  return (
    <div className="stepper" aria-label={`Etapa ${step} de 2`} title={step === 1 ? 'Etapa 1 de 2: identificação do paciente' : 'Etapa 2 de 2: dados específicos da sua função'}>
      <span className="stepper__dot stepper__dot--on">1</span>
      <span className="stepper__line" />
      <span className={`stepper__dot ${step >= 2 ? 'stepper__dot--on' : ''}`}>2</span>
    </div>
  );
}

export function Modal({ title, icon, children, onClose, actions }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__head">
          {title && <h2 className="modal__title">{icon}{title}</h2>}
          <button type="button" className="icon-btn" aria-label="Fechar" title="Fechar esta janela" onClick={onClose}><IconClose /></button>
        </div>
        <div className="modal__body">{children}</div>
        {actions && <div className="modal__actions">{actions}</div>}
      </div>
    </div>
  );
}

/** Modal de confirmação padrão: "Não, cancelar" / "Sim, ...". */
export function ConfirmModal({ title, icon, children, confirmLabel, onConfirm, onClose, loading }) {
  return (
    <Modal
      title={title}
      icon={icon}
      onClose={onClose}
      actions={(
        <>
          <Button variant="outline" className="btn--sm" title="Cancelar e fechar esta janela" onClick={onClose}>Não, cancelar</Button>
          <Button className="btn--sm" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      )}
    >
      {children}
    </Modal>
  );
}

export function Toast() {
  const { toast, closeToast } = useApp();
  if (!toast) return null;
  const ok = toast.type === 'success';
  return (
    <div key={toast.key} className={`toast toast--${ok ? 'ok' : 'fail'}`} role="status" title="Clique para fechar o aviso" onClick={closeToast}>
      {ok ? <IconCheckCircle size={30} /> : <IconAlert size={30} />}
      <div>
        <strong>{ok ? 'Tarefa executada com sucesso' : 'Falha na operação'}</strong>
        <span>{toast.message || (ok ? 'A operação foi concluída sem falhas' : 'Não foi possível concluir a operação. Tente novamente')}</span>
      </div>
    </div>
  );
}

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {NAV_ITEMS.map((i) => (
        <NavLink key={i.to} to={i.to} title={i.hint} className={({ isActive }) => `bottom-nav__item ${isActive ? 'is-active' : ''}`}>
          {i.icon}
          <span>{i.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function Avatar({ src, size = 96, busy = false, children }) {
  return (
    <div className={`avatar ${busy ? 'avatar--busy' : ''}`} style={{ width: size, height: size }}>
      {src ? <img src={apiUrl(src)} alt="Foto de perfil" /> : <IconUser size={size * 0.45} strokeWidth={1.6} />}
      {children}
    </div>
  );
}

export function Loading() {
  return <p className="muted center pad">Carregando...</p>;
}
