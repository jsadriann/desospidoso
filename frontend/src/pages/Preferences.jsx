import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { Screen, SectionTitle, Switch, TopBar } from '../components/ui.jsx';

// Perfil > Preferências. "Usar o tema do dispositivo": o app acompanha o tema claro/escuro do celular ou
// computador. Enquanto estiver ativa, a chave de tema do Perfil fica desabilitada. A escolha é salva na conta.
export default function Preferences() {
  const navigate = useNavigate();
  const { theme, themePref, setTheme, notify } = useApp();
  const [saving, setSaving] = useState(false);
  const followDevice = themePref === 'system';

  const change = async (on) => {
    if (saving) return;
    setSaving(true);
    // Ao desativar, o app continua no tema que está na tela; depois é só usar a chave do Perfil.
    const ok = await setTheme(on ? 'system' : theme);
    setSaving(false);
    notify(ok ? 'success' : 'error', ok ? 'Preferência salva' : 'Não foi possível salvar a preferência. Tente novamente.');
  };

  return (
    <Screen narrow>
      <TopBar title="Preferências" onBack={() => navigate('/perfil')} backTitle="Voltar para o perfil" />

      <SectionTitle>Aparência</SectionTitle>
      <div className="pref-row">
        <div className="pref-row__text">
          <p className="pref-row__title">Usar o tema do dispositivo</p>
          <p className="pref-row__desc">
            O tema claro ou escuro acompanha a configuração do seu celular ou computador. Enquanto esta opção estiver
            ativa, a troca de tema no Perfil fica desabilitada.
          </p>
        </div>
        <Switch
          checked={followDevice}
          onChange={change}
          disabled={saving}
          label="Usar o tema do dispositivo"
          title={followDevice ? 'Desativar: escolher o tema manualmente no Perfil' : 'Ativar: seguir o tema do dispositivo'}
        />
      </div>
    </Screen>
  );
}
