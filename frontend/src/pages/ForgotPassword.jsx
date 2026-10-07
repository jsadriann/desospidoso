import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { AuthLayout, Button, ErrorText, Logo, Modal, PasswordField, Screen, TextField } from '../components/ui.jsx';
import { IconArrowLeft, IconCheckCircle } from '../components/Icons.jsx';

// Fluxo em 3 passos: e-mail -> código -> nova senha -> modal de sucesso
export default function ForgotPassword() {
  const navigate = useNavigate();
  const { notify } = useApp();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [pw, setPw] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const run = async (fn) => {
    setError('');
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = (e) => {
    e?.preventDefault();
    if (!email.trim()) return setError('Por favor, preencha todos os campos antes de continuar.');
    run(async () => {
      await api.forgotPassword(email);
      notify('success');
      setStep('code');
    });
  };

  const sendCode = (e) => {
    e.preventDefault();
    if (!code.trim()) return setError('Por favor, preencha todos os campos antes de continuar.');
    run(async () => {
      const { resetToken: t } = await api.verifyCode(email, code);
      setResetToken(t);
      notify('success');
      setStep('password');
    });
  };

  const sendPassword = (e) => {
    e.preventDefault();
    if (!pw.password || !pw.confirm) return setError('Por favor, preencha todos os campos antes de continuar.');
    if (pw.password !== pw.confirm) return setError('As senhas devem coincidir.');
    run(async () => {
      await api.resetPassword(resetToken, pw.password, pw.confirm);
      setDone(true);
    });
  };

  const titles = { email: 'Esqueci minha senha', code: 'Redefinição de Senha', password: 'Redefinição de Senha' };

  return (
    <AuthLayout>
      <Screen className="auth">
        <div className="auth__logo"><Logo /></div>
        <div className="subbar">
          {step === 'email' && (
            <button className="icon-btn" aria-label="Voltar" title="Voltar para o login" onClick={() => navigate('/login')}><IconArrowLeft /></button>
          )}
          <h1 className="subbar__title">{titles[step]}</h1>
        </div>

        {step === 'email' && (
          <form className="stack" onSubmit={sendEmail} noValidate>
            <p className="small">
              Por favor, insira seu e-mail no campo abaixo para iniciarmos a redefinição da sua senha. Enviaremos um código
              para que você possa prosseguir com o processo.
            </p>
            <TextField label="E-mail" type="email" placeholder="annadasilva@yahoo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <ErrorText>{error}</ErrorText>
            <Button type="submit" loading={loading} title="Enviar um código de redefinição para este e-mail">Enviar</Button>
            <Button type="button" variant="outline" title="Cancelar e voltar para o login" onClick={() => navigate('/login')}>Cancelar</Button>
          </form>
        )}

        {step === 'code' && (
          <form className="stack" onSubmit={sendCode} noValidate>
            <p className="small">
              Por favor, insira o código que enviamos no campo abaixo para continuar com a redefinição da senha.
            </p>
            <TextField label="Código" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
            <ErrorText>{error}</ErrorText>
            <Button type="submit" loading={loading} title="Confirmar o código recebido por e-mail">Enviar</Button>
            <Button type="button" variant="outline" title="Enviar um novo código para o seu e-mail" onClick={() => sendEmail()} disabled={loading}>Reenviar código</Button>
          </form>
        )}

        {step === 'password' && (
          <form className="stack" onSubmit={sendPassword} noValidate>
            <p className="small">
              Crie sua nova senha abaixo. As senhas devem coincidir e conter no mínimo 8 caracteres, incluindo ao menos um
              caractere especial.
            </p>
            <PasswordField label="Senha" placeholder="********" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} />
            <PasswordField label="Confirmar Senha" placeholder="********" autoComplete="new-password" showToggle={false} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            <ErrorText>{error}</ErrorText>
            <Button type="submit" loading={loading} title="Salvar a nova senha">Redefinir senha</Button>
          </form>
        )}

        {done && (
          <Modal
            onClose={() => navigate('/login')}
            actions={(
              <>
                <Button variant="outline" className="btn--sm" title="Fechar esta janela" onClick={() => setDone(false)}>Cancelar</Button>
                <Button className="btn--sm" title="Ir para o login e entrar com a nova senha" onClick={() => navigate('/login', { replace: true })}>Voltar para login</Button>
              </>
            )}
          >
            <div className="center success-modal">
              <IconCheckCircle size={64} className="text-green" />
              <p>Sua senha foi redefinida com sucesso. Retorne ao login para acessar a sua conta.</p>
            </div>
          </Modal>
        )}
      </Screen>
    </AuthLayout>
  );
}
