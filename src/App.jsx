import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Admin from "./pages/Admin/Admin";
import DashboardAdmin from "./pages/Admin/DashboardAdmin";
import DashboardUsers from "./pages/Admin/DashboardUsers";

import Landing from "./pages/Landing";
import Login from "./pages/Login/Login";
import SignUp from "./pages/Login/SignUp";
import ResetPassword from "./pages/Login/ResetPassword";

import Dashboard from "./pages/Dashboard/Dashboard";
import Partner from "./pages/FindPartners/Parceiros";
import Sessoes from "./pages/MySessions/Sessoes";
import Recursos from "./pages/Resources/Recursos";
import Profile from "./pages/Profile/EditProfile";
import ProjectPartners from "./pages/Partners/ProjectsPartners";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota principal que carrega a Landing Page */}
        <Route path="/admin" element={<Admin />}>
          <Route path="dashboard" element={<DashboardAdmin />} />
          <Route path="users" element={<DashboardUsers />} />
        </Route>

        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/partners" element={<Partner />} />
        <Route path="/sessions" element={<Sessoes />} />
        <Route path="/resources" element={<Recursos />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/project-partners" element={<ProjectPartners />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
