import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { Avatar, BottomNav, ConfirmModal, Screen } from '../components/ui.jsx';
import { IconChevronRight, IconLogout, IconTrash, IconUser } from '../components/Icons.jsx';

export default function Profile() {
  const { user, logout, notify } = useApp();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // 'logout' | 'delete'
  const [busy, setBusy] = useState(false);

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
        <Avatar src={user.avatar} size={100} />
        <div>
          <p className="profile-head__name">{user.name}</p>
          <p className="muted">{user.email}</p>
        </div>
      </div>
      <ul className="menu">
        <li><Link to="/perfil/dados" title="Ver e editar nome, e-mail, senha, função e foto"><IconUser /> <span>Dados pessoais</span> <IconChevronRight /></Link></li>
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
      {modal === 'delete' && (
        <ConfirmModal title="Deletar conta" confirmLabel="Sim, deletar" loading={busy} onConfirm={doDelete} onClose={() => setModal(null)}>
          Deseja deletar a sua conta? A ação não pode ser desfeita.
        </ConfirmModal>
      )}
      <BottomNav />
    </Screen>
  );
}
