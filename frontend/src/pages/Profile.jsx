import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { Avatar, BottomNav, ConfirmModal, Screen } from '../components/ui.jsx';
import { IconCamera, IconChevronRight, IconLogout, IconSettings, IconTrash, IconUser } from '../components/Icons.jsx';
import { resizeImage } from '../utils/format.js';

export default function Profile() {
  const { user, setUser, logout, notify } = useApp();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // 'logout' | 'delete' | 'photo'
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef();

  // Foto de perfil: escolhida aqui mesmo, enviada na hora para o Object Storage
  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    try {
      const { user: u } = await api.uploadAvatar(await resizeImage(file));
      setUser(u);
      notify('success', 'Foto de perfil atualizada');
    } catch (err) {
      notify('error', err.message || 'Não foi possível carregar a imagem.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    try {
      const { user: u } = await api.removeAvatar();
      setUser(u);
      setModal(null);
      notify('success', 'Foto de perfil removida');
    } catch (err) {
      notify('error', err.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const doLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await api.deleteMe();
      logout();
      navigate('/', { replace: true });
    } catch {
      notify('error');
      setBusy(false);
    }
  };

  return (
    <Screen narrow withNav>
      <header className="page-head"><h1>Perfil</h1></header>
      <div className="profile-head">
        <button
          type="button"
          className="avatar-btn"
          aria-label={user.avatar ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}
          title={user.avatar ? 'Trocar foto de perfil (PNG, JPG ou WEBP)' : 'Adicionar foto de perfil (PNG, JPG ou WEBP)'}
          disabled={photoBusy}
          onClick={() => fileRef.current.click()}
        >
          <Avatar src={user.avatar} size={100} busy={photoBusy}><span className="avatar__badge"><IconCamera size={18} /></span></Avatar>
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pickPhoto} />
        <div className="profile-head__info">
          <p className="profile-head__name">{user.name}</p>
          <p className="muted">{user.email}</p>
          <div className="profile-head__photo">
            <button type="button" className="link-btn" disabled={photoBusy} title="Escolher uma imagem do seu dispositivo" onClick={() => fileRef.current.click()}>
              {photoBusy ? 'Enviando...' : user.avatar ? 'Trocar foto' : 'Adicionar foto'}
            </button>
            {user.avatar && !photoBusy && (
              <button type="button" className="link-btn link-btn--danger" title="Remover a foto de perfil" onClick={() => setModal('photo')}>
                Remover
              </button>
            )}
          </div>
        </div>
      </div>
      <ul className="menu">
        <li><Link to="/perfil/dados" title="Ver e editar nome, e-mail, senha, função e foto"><IconUser /> <span>Dados pessoais</span> <IconChevronRight /></Link></li>
        <li><Link to="/perfil/preferencias" title="Tema claro ou escuro"><IconSettings /> <span>Preferências</span> <IconChevronRight /></Link></li>
        <li><button title="Sair da sua conta neste dispositivo" onClick={() => setModal('logout')}><IconLogout /> <span>Sair</span> <IconChevronRight /></button></li>
      </ul>
      <ul className="menu menu--spaced">
        <li><button title="Excluir sua conta permanentemente" onClick={() => setModal('delete')}><IconTrash /> <span>Deletar conta</span> <IconChevronRight /></button></li>
      </ul>

      {modal === 'logout' && (
        <ConfirmModal title="Sair da conta" confirmLabel="Sim, sair" onConfirm={doLogout} onClose={() => setModal(null)}>
          Deseja sair da conta?
        </ConfirmModal>
      )}
      {modal === 'photo' && (
        <ConfirmModal title="Remover foto" confirmLabel="Sim, remover" loading={photoBusy} onConfirm={removePhoto} onClose={() => setModal(null)}>
          Deseja remover a sua foto de perfil?
        </ConfirmModal>
      )}
      {modal === 'delete' && (
        <ConfirmModal title="Deletar conta" confirmLabel="Sim, deletar" loading={busy} onConfirm={doDelete} onClose={() => setModal(null)}>
          Deseja deletar a sua conta? A ação não pode ser desfeita.
        </ConfirmModal>
      )}
      <BottomNav />
    </Screen>
  );
}
