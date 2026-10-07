import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { Actions, Avatar, Button, ConfirmModal, ErrorText, PasswordField, Screen, TextField, TopBar } from '../components/ui.jsx';
import { IconCamera } from '../components/Icons.jsx';
import { resizeImage } from '../utils/format.js';
import { RoleOptions } from './Register.jsx';

export default function PersonalData({ editing = false }) {
  const { user, setUser, meta, notify } = useApp();
  const navigate = useNavigate();

  if (!editing) {
    return (
      <Screen narrow>
        <TopBar title="Dados pessoais" onBack={() => navigate('/perfil')} backTitle="Voltar para o perfil" />
        <div className="center-block"><Avatar src={user.avatar} size={100} /></div>
        <dl className="kv">
          <div className="kv__row"><dt>Nome Completo:</dt><dd>{user.name}</dd></div>
          <div className="kv__row"><dt>E-mail:</dt><dd>{user.email}</dd></div>
          <div className="kv__row"><dt>Senha:</dt><dd>********</dd></div>
          <div className="kv__row"><dt>Função:</dt><dd>{meta?.roles?.[user.role] || user.role}</dd></div>
        </dl>
        <div className="stack">
          <Actions>
            <Button title="Editar seus dados pessoais" onClick={() => navigate('/perfil/dados/editar')}>Editar</Button>
            <Button variant="outline" title="Voltar para o perfil" onClick={() => navigate('/perfil')}>Cancelar</Button>
          </Actions>
        </div>
      </Screen>
    );
  }
  return <EditPersonalData user={user} setUser={setUser} meta={meta} notify={notify} navigate={navigate} />;
}

function EditPersonalData({ user, setUser, meta, notify, navigate }) {
  const fileRef = useRef();
  const [form, setForm] = useState({
    name: user.name, email: user.email, password: '', confirmPassword: '', role: user.role, avatar: user.avatar,
  });
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setForm((f) => ({ ...f, avatar: null }));
      const avatar = await resizeImage(file);
      setForm((f) => ({ ...f, avatar }));
    } catch {
      setError('Não foi possível carregar a imagem.');
    }
  };

  const ask = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.role) return setError('Por favor, preencha todos os campos antes de continuar.');
    if (form.password !== form.confirmPassword) return setError('As senhas não coincidem.');
    setConfirm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { user: u } = await api.updateMe(form);
      setUser(u);
      notify('success');
      navigate('/perfil/dados', { replace: true });
    } catch (err) {
      setConfirm(false);
      setError(err.message);
      notify('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen narrow>
      <TopBar title="Dados pessoais" />
      <div className="center-block">
        <button type="button" className="avatar-btn" aria-label="Alterar foto de perfil" title="Alterar foto de perfil (PNG, JPG ou WEBP)" onClick={() => fileRef.current.click()}>
          <Avatar src={form.avatar} size={100}><span className="avatar__badge"><IconCamera size={18} /></span></Avatar>
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pickPhoto} />
      </div>
      <form id="personal-form" className="stack" onSubmit={ask} noValidate>
        <TextField label="Nome Completo" value={form.name} onChange={set('name')} autoComplete="name" />
        <TextField label="E-mail" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
        <PasswordField label="Senha" placeholder="Deixe em branco para manter a atual" value={form.password} onChange={set('password')} autoComplete="new-password" />
        <PasswordField label="Confirmar Senha" placeholder="********" showToggle={false} value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
        <p className="field__label">Função</p>
        <RoleOptions roles={meta?.roles} value={form.role} onChange={(role) => setForm({ ...form, role })} />
        <ErrorText>{error}</ErrorText>
      </form>
      <Actions sticky>
        <Button type="submit" form="personal-form" title="Salvar as alterações da sua conta">Salvar</Button>
        <Button type="button" variant="outline" title="Descartar as alterações" onClick={() => navigate('/perfil/dados')}>Cancelar</Button>
      </Actions>
      {confirm && (
        <ConfirmModal title="Salvar" confirmLabel="Sim, salvar" loading={saving} onConfirm={save} onClose={() => setConfirm(false)}>
          Deseja salvar as alterações realizadas na sua conta?
        </ConfirmModal>
      )}
    </Screen>
  );
}
