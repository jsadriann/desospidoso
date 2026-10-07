import { Navigate, useNavigate } from 'react-router-dom';
import About from '../components/About.jsx';
import { introSeen, markIntroSeen } from '../utils/intro.js';

/**
 * Tela de primeiro acesso. Em "/" só aparece na primeira visita (depois redireciona para o login);
 * em "/sobre" pode ser revista a qualquer momento.
 */
export default function Home({ always = false }) {
  const navigate = useNavigate();
  if (!always && introSeen()) return <Navigate to="/login" replace />;
  const start = () => {
    markIntroSeen();
    navigate('/login');
  };
  return <About onStart={start} onBack={always ? () => navigate('/login') : undefined} />;
}
