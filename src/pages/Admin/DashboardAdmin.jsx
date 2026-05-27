import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";

import './dashboard-admin.css';

const DashboardAdmin = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    approvedUsers: 0,
    pendingUsers: 0,
    topHubs: [],
    topLanguages: [],
  });

  useEffect(() => {
    const loadStats = async () => {
      // 👥 todos usuários
      const { data: users } = await supabase
        .from("profiles")
        .select("is_approved, hub, speaks, learns");

      if (!users) return;

      const totalUsers = users.length;
      const approvedUsers = users.filter(u => u.is_approved).length;
      const pendingUsers = users.filter(u => !u.is_approved).length;

      // 🌍 hubs
      const hubCount = {};
      users.forEach(u => {
        if (!u.hub) return;
        hubCount[u.hub] = (hubCount[u.hub] || 0) + 1;
      });

      const topHubs = Object.entries(hubCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // 🗣 idiomas (fala + aprende juntos)
      const langCount = {};
      users.forEach(u => {
        const key1 = u.speaks;
        const key2 = u.learns;

        if (key1) langCount[key1] = (langCount[key1] || 0) + 1;
        if (key2) langCount[key2] = (langCount[key2] || 0) + 1;
      });

      const topLanguages = Object.entries(langCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      setStats({
        totalUsers,
        approvedUsers,
        pendingUsers,
        topHubs,
        topLanguages,
      });
    };

    loadStats();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>

      {/* KPIs */}
      <div className="grid">
        <div>Total: {stats.totalUsers}</div>
        <div>Aprovados: {stats.approvedUsers}</div>
        <div>Pendentes: {stats.pendingUsers}</div>
      </div>

      {/* HUBS */}
      <h2>Top Hubs</h2>
      <ul>
        {stats.topHubs.map(([hub, count]) => (
          <li key={hub}>
            {hub}: {count}
          </li>
        ))}
      </ul>

      {/* IDIOMAS */}
      <h2>Top Idiomas</h2>
      <ul>
        {stats.topLanguages.map(([lang, count]) => (
          <li key={lang}>
            {lang}: {count}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DashboardAdmin;