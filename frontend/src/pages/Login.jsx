import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { AuthLayout, Button, ErrorText, Logo, PasswordField, Screen, TextField } from '../components/ui.jsx';

export default function Login() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) return setError('Por favor, preencha todos os campos antes de continuar.');
    setLoading(true);
    try {
      signIn(await api.login(form.email, form.password));
      navigate(location.state?.from || '/pacientes', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Screen className="auth">
        <div className="auth__logo"><Logo /></div>
        <form className="stack" onSubmit={submit} noValidate>
          <TextField
            label="E-mail" type="email" autoComplete="email" placeholder="annadasilva@yahoo.com"
            value={form.email} invalid={!!error} onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <PasswordField
            label="Senha" autoComplete="current-password" placeholder="********"
            value={form.password} invalid={!!error} onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Link className="link" to="/esqueci-senha" title="Recuperar o acesso criando uma nova senha">Esqueci minha senha</Link>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" loading={loading} title="Entrar no sistema">Login</Button>
        </form>
        <p className="center small">
          Não tem uma conta ainda? <Link className="link" to="/cadastro" title="Criar uma conta de profissional">Cadastre-se</Link>
        </p>
        <p className="center small">
          <Link className="link muted-link" to="/sobre" title="Ver a apresentação do aplicativo">Conheça o DesospIdoso</Link>
        </p>
      </Screen>
    </AuthLayout>
  );
}
