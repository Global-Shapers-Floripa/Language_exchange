import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login/Login';
import SignUp from './pages/Login/SignUp';
import PendingApproval from './pages/Login/PendingApproval';

import AdminDashboard from './pages/Admin/Admin';


import Dashboard from './pages/Dashboard/Dashboard';
import Partner from './pages/FindPartners/Parceiros';
import Sessoes from './pages/MySessions/Sessoes';
import Recursos from './pages/Resources/Recursos';
import Profile from './pages/Profile/EditProfile';
import ProjectPartners from './pages/Partners/ProjectsPartners';
import Help from './pages/Help/Help';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota principal que carrega a Landing Page */}
        <Route path="/" element={<Landing />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/pending-approval" element={<PendingApproval />} />

        <Route path="/admin" element={<AdminDashboard />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/partners" element={<Partner />} />
        <Route path="/sessions" element={<Sessoes />} />
        <Route path="/resources" element={<Recursos />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/project-partners" element={<ProjectPartners />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </Router>
  );
}

export default App;