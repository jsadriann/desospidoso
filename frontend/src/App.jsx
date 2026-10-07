import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext.jsx';
import { Loading, SideNav, Toast } from './components/ui.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Welcome from './pages/Welcome.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Patients from './pages/Patients.jsx';
import Help from './pages/Help.jsx';
import SelectIdentification from './pages/SelectIdentification.jsx';
import IdentificationForm from './pages/IdentificationForm.jsx';
import FillSection from './pages/FillSection.jsx';
import PatientDetails from './pages/PatientDetails.jsx';
import Records from './pages/Records.jsx';
import RecordDetails from './pages/RecordDetails.jsx';
import Profile from './pages/Profile.jsx';
import PersonalData from './pages/PersonalData.jsx';

function RequireAuth() {
  const { user, loading } = useApp();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Área logada: menu lateral no desktop + conteúdo. */
function Shell() {
  return (
    <div className="shell">
      <SideNav />
      <div className="shell__main"><Outlet /></div>
    </div>
  );
}

function GuestOnly() {
  const { user, loading } = useApp();
  if (loading) return <Loading />;
  if (user) return <Navigate to="/pacientes" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/" element={<Home />} />
          <Route path="/sobre" element={<Home always />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/boas-vindas" element={<Welcome />} />
          <Route element={<Shell />}>
            <Route path="/pacientes" element={<Patients />} />
            <Route path="/pacientes/ajuda" element={<Help />} />
            <Route path="/pacientes/novo" element={<SelectIdentification />} />
            <Route path="/pacientes/novo/identificacao" element={<IdentificationForm />} />
            <Route path="/pacientes/:id" element={<PatientDetails />} />
            <Route path="/pacientes/:id/identificacao" element={<IdentificationForm />} />
            <Route path="/pacientes/:id/preencher" element={<FillSection />} />
            <Route path="/fichas" element={<Records />} />
            <Route path="/fichas/:id" element={<RecordDetails />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/perfil/dados" element={<PersonalData />} />
            <Route path="/perfil/dados/editar" element={<PersonalData editing />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </div>
  );
}
