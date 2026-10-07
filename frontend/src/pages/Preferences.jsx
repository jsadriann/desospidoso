import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { Screen, SectionTitle, TopBar } from '../components/ui.jsx';
import { IconCheckCircle, IconMoon, IconSun } from '../components/Icons.jsx';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', description: 'Fundo claro, ideal para ambientes iluminados.', icon: <IconSun size={26} /> },
  { value: 'dark', label: 'Escuro', description: 'Fundo escuro, mais confortável à noite e com pouca luz.', icon: <IconMoon size={26} /> },
];

// Perfil > Preferências. A escolha é aplicada na hora e salva na conta do usuário.
export default function Preferences() {
  const navigate = useNavigate();
  const { theme, setTheme, notify } = useApp();
  const [saving, setSaving] = useState(false);

  const choose = async (value) => {
    if (value === theme || saving) return;
    setSaving(true);
    const ok = await setTheme(value);
    setSaving(false);
    notify(ok ? 'success' : 'error', ok ? 'Preferência salva' : undefined);
  };

  return (
    <Screen narrow>
      <TopBar title="Preferências" onBack={() => navigate('/perfil')} backTitle="Voltar para o perfil" />

      <SectionTitle>Aparência</SectionTitle>
      <p className="small muted">Tema</p>

      <div className="theme-options" role="radiogroup" aria-label="Tema">
        {THEME_OPTIONS.map((o) => {
          const active = theme === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={`theme-option theme-option--${o.value} ${active ? 'is-active' : ''}`}
              title={`Usar o tema ${o.label.toLowerCase()}`}
              disabled={saving}
              onClick={() => choose(o.value)}
            >
              <span className="theme-option__preview" aria-hidden="true">
                <span className="theme-option__bar" />
                <span className="theme-option__line" />
                <span className="theme-option__line theme-option__line--short" />
                <span className="theme-option__chip" />
              </span>
              <span className="theme-option__body">
                <span className="theme-option__title">{o.icon}{o.label}</span>
                <span className="theme-option__desc">{o.description}</span>
              </span>
              {active && <IconCheckCircle size={22} className="theme-option__check" />}
            </button>
          );
        })}
      </div>
    </Screen>
  );
}
