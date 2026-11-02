import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { Screen, SectionTitle, Switch, TopBar } from '../components/ui.jsx';
import { LIST_SORTS, STATUS } from '../components/patient.jsx';

const TEXT_SIZES = [
  { value: 'normal', label: 'Normal', sample: 15 },
  { value: 'grande', label: 'Grande', sample: 18 },
  { value: 'muito-grande', label: 'Muito grande', sample: 21 },
];

/** Uma linha de opção: título, explicação e o controle (chave, botões ou lista) à direita/abaixo. */
function PrefRow({ title, desc, children, stacked = false }) {
  return (
    <div className={`pref-row ${stacked ? 'pref-row--stacked' : ''}`}>
      <div className="pref-row__text">
        <p className="pref-row__title">{title}</p>
        {desc && <p className="pref-row__desc">{desc}</p>}
      </div>
      <div className="pref-row__control">{children}</div>
    </div>
  );
}

// Perfil > Preferências. Tudo é aplicado na hora e salvo na conta do usuário.
export default function Preferences() {
  const navigate = useNavigate();
  const { theme, themePref, setTheme, prefs, updatePrefs, notify } = useApp();
  const [saving, setSaving] = useState(false);
  const followDevice = themePref === 'system';

  /** Salva e avisa (uma preferência por vez). */
  const run = async (action) => {
    if (saving) return;
    setSaving(true);
    const ok = await action();
    setSaving(false);
    notify(ok ? 'success' : 'error', ok ? 'Preferência salva' : 'Não foi possível salvar a preferência. Tente novamente.');
  };
  const save = (patch) => run(() => updatePrefs(patch));

  return (
    <Screen narrow>
      <TopBar title="Preferências" onBack={() => navigate('/perfil')} backTitle="Voltar para o perfil" />

      <SectionTitle>Aparência</SectionTitle>
      <div className="pref-group">
        <PrefRow
          title="Usar o tema do dispositivo"
          desc="O tema claro ou escuro acompanha a configuração do seu celular ou computador. Enquanto esta opção estiver ativa, a troca de tema no Perfil fica desabilitada."
        >
          <Switch
            checked={followDevice}
            // Ao desativar, o app continua no tema que está na tela; depois é só usar a chave do Perfil.
            onChange={(on) => run(() => setTheme(on ? 'system' : theme))}
            disabled={saving}
            label="Usar o tema do dispositivo"
            title={followDevice ? 'Desativar: escolher o tema manualmente no Perfil' : 'Ativar: seguir o tema do dispositivo'}
          />
        </PrefRow>

        <PrefRow title="Tamanho do texto" desc="Aumenta textos, botões e espaçamentos de todas as telas na mesma proporção." stacked>
          <div className="segmented" role="radiogroup" aria-label="Tamanho do texto">
            {TEXT_SIZES.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={prefs.textSize === t.value}
                className={`segmented__item ${prefs.textSize === t.value ? 'is-active' : ''}`}
                title={`Usar texto ${t.label.toLowerCase()}`}
                disabled={saving}
                onClick={() => prefs.textSize !== t.value && save({ textSize: t.value })}
              >
                <span className="segmented__sample" style={{ fontSize: t.sample }} aria-hidden="true">Aa</span>
                {t.label}
              </button>
            ))}
          </div>
        </PrefRow>

        <PrefRow title="Alto contraste" desc="Cores mais fortes e bordas mais escuras, para ambientes muito iluminados ou para quem enxerga com dificuldade.">
          <Switch
            checked={prefs.highContrast}
            onChange={(on) => save({ highContrast: on })}
            disabled={saving}
            label="Alto contraste"
            title={prefs.highContrast ? 'Desativar o alto contraste' : 'Ativar o alto contraste'}
          />
        </PrefRow>

        <PrefRow title="Reduzir animações" desc="Desliga os movimentos das telas, como cartões entrando e janelas deslizando.">
          <Switch
            checked={prefs.reduceMotion}
            onChange={(on) => save({ reduceMotion: on })}
            disabled={saving}
            label="Reduzir animações"
            title={prefs.reduceMotion ? 'Voltar a mostrar as animações' : 'Desligar as animações'}
          />
        </PrefRow>
      </div>

      <SectionTitle>Lista de pacientes</SectionTitle>
      <div className="pref-group">
        <PrefRow title="Mostrar ao abrir" desc="Filtro de status já aplicado quando você entra na lista de pacientes." stacked>
          <select
            className="pref-select"
            value={prefs.listStatus}
            disabled={saving}
            title="Filtro inicial da lista de pacientes"
            onChange={(e) => save({ listStatus: e.target.value })}
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>Só {s.short.toLowerCase()}</option>)}
          </select>
        </PrefRow>
        <PrefRow title="Ordem ao abrir" desc="Como os cartões aparecem ordenados quando você entra na lista." stacked>
          <select
            className="pref-select"
            value={prefs.listSort}
            disabled={saving}
            title="Ordem inicial da lista de pacientes"
            onChange={(e) => save({ listSort: e.target.value })}
          >
            {Object.entries(LIST_SORTS).map(([k, o]) => <option key={k} value={k}>{o.label}</option>)}
          </select>
        </PrefRow>
      </div>

      <SectionTitle>Preenchimento</SectionTitle>
      <div className="pref-group">
        <PrefRow
          title="Pedir confirmação antes de salvar"
          desc="Mostra a pergunta “Deseja salvar?” ao salvar uma seção, uma identificação ou seus dados. Excluir, sair e remover continuam sempre pedindo confirmação."
        >
          <Switch
            checked={prefs.confirmSave}
            onChange={(on) => save({ confirmSave: on })}
            disabled={saving}
            label="Pedir confirmação antes de salvar"
            title={prefs.confirmSave ? 'Salvar direto, sem perguntar' : 'Perguntar antes de salvar'}
          />
        </PrefRow>
      </div>
    </Screen>
  );
}
