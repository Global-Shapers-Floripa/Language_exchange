import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login/Login';
import SignUp from './pages/Login/SignUp';
import PendingApproval from './pages/Login/PendingApproval';
import ResetPassword from './pages/Login/ResetPassword';

import AdminDashboard from './pages/Admin/Admin';


import Dashboard from './pages/Dashboard/Dashboard';
import Partner from './pages/FindPartners/Parceiros';
import Sessoes from './pages/MySessions/Sessoes';
import Recursos from './pages/Resources/Recursos';
import Profile from './pages/Profile/EditProfile';
import ProjectPartners from './pages/Partners/ProjectsPartners';
import Help from './pages/Help/Help';
import Comunidade from './pages/Community/Comunidade';
import UpdatePrompt from './components/common/UpdatePrompt';
import './App.css';

import { Analytics } from "@vercel/analytics/react"

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota principal que carrega a Landing Page */}
        <Route path="/" element={<Landing />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/admin" element={<AdminDashboard />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/partners" element={<Partner />} />
        <Route path="/sessions" element={<Sessoes />} />
        <Route path="/comunidade" element={<Comunidade />} />
        <Route path="/resources" element={<Recursos />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/project-partners" element={<ProjectPartners />} />
        <Route path="/help" element={<Help />} />
      </Routes>

       <Analytics />
       <UpdatePrompt />
    </Router>
  );
}

export default App;