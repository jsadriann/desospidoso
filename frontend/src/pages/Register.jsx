import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { AuthLayout, Button, ErrorText, Logo, OptionCard, PasswordField, Screen, SectionTitle, TextField } from '../components/ui.jsx';

export function RoleOptions({ roles, value, onChange }) {
  return (
    <div className="options options--grid">
      {Object.entries(roles || {}).map(([key, label]) => (
        <OptionCard key={key} name="role" checked={value === key} onChange={() => onChange(key)} label={`${label}.`} />
      ))}
    </div>
  );
}

export default function Register() {
  const { meta, signIn } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (Object.values(form).some((v) => !v.trim())) return setError('Por favor, preencha todos os campos antes de continuar.');
    setLoading(true);
    try {
      signIn(await api.register(form));
      navigate('/boas-vindas', { replace: true });
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
          <SectionTitle>Dados básicos</SectionTitle>
          <TextField label="Nome completo" placeholder="Anna da Silva" autoComplete="name" value={form.name} onChange={set('name')} />
          <TextField label="E-mail" type="email" placeholder="annadasilva@yahoo.com" autoComplete="email" value={form.email} onChange={set('email')} />
          <PasswordField label="Senha" placeholder="********" autoComplete="new-password" value={form.password} onChange={set('password')} />
          <PasswordField label="Confirmar senha" placeholder="********" autoComplete="new-password" showToggle={false} value={form.confirmPassword} onChange={set('confirmPassword')} />
          <p className="hint">A senha deve ter no mínimo 8 caracteres, incluindo ao menos um caractere especial.</p>

          <SectionTitle>Função</SectionTitle>
          <RoleOptions roles={meta?.roles} value={form.role} onChange={(role) => setForm({ ...form, role })} />

          <ErrorText>{error}</ErrorText>
          <Button type="submit" loading={loading} title="Criar a sua conta">Cadastrar</Button>
        </form>
        <p className="center small">
          Já possui uma conta? <Link className="link" to="/login" title="Já tenho conta: ir para o login">Logue-se</Link>
        </p>
      </Screen>
    </AuthLayout>
  );
}
