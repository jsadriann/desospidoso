import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import About from '../components/About.jsx';

// Boas-vindas logo após o cadastro.
export default function Welcome() {
  const { user } = useApp();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0];
  const go = () => navigate('/pacientes', { replace: true });
  return <About greeting={`Seja bem-vindo(a) ao DesospIdoso, ${firstName}!`} onStart={go} onBack={go} />;
}
