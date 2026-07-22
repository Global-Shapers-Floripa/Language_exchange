import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { usePublicSessions } from "../../hooks/usePublicSessions";
import { useCommunityBadges } from "../../hooks/useCommunityBadges";
import { useSessionReactions } from "../../hooks/useSessionReactions";
import CommunitySessionModal from "../../components/common/CommunitySessionModal";
import SessionCard from "../../components/common/SessionCard";
import BadgeWall from "../../components/common/BadgeWall";

import "./comunidade.css";

const Comunidade = () => {
  const { t } = useTranslation("dashboard");
  const { publicSessions, loading, error } = usePublicSessions();
  const { counts, likedByMe, toggleReaction } = useSessionReactions(
    publicSessions.map((session) => session.id),
  );
  const [selectedSession, setSelectedSession] = useState(null);

  const {
    achievements,
    hasMore,
    loading: loadingBadges,
    loadMore,
  } = useCommunityBadges();

  const getReaction = (sessionId) => ({
    count: counts[sessionId] || 0,
    likedByMe: likedByMe.has(sessionId),
    onToggle: () => toggleReaction(sessionId),
  });

  return (
    <DashboardLayout>
      <div className="community-header">
        <h2>{t("sidebar.community")}</h2>
        <p className="community-subtitle">
          {t("communityPage.subtitle")}
        </p>
      </div>

      {loading && (
        <div className="loading-message">
          <p>{t("communityPage.loading")}</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{t("communityPage.loadError", { error })}</p>
        </div>
      )}

      {!loading && !error && publicSessions.length === 0 && (
        <div className="empty-message">
          <p>{t("communityPage.empty")}</p>
        </div>
      )}

      {!loading && !error && publicSessions.length > 0 && (
        <div className="community-grid">
          {publicSessions.map((session) => (
            <SessionCard
              key={session.id}
              photoUrl={session.session_photo_url}
              personA={session.owner}
              personB={session.partner}
              date={session.date}
              duration={session.duration}
              languages={session.languages}
              reaction={getReaction(session.id)}
              onClick={() => setSelectedSession(session)}
            />
          ))}
        </div>
      )}

      <CommunitySessionModal
        session={selectedSession}
        reaction={selectedSession ? getReaction(selectedSession.id) : null}
        onClose={() => setSelectedSession(null)}
      />

      <BadgeWall
        achievements={achievements}
        hasMore={hasMore}
        loading={loadingBadges}
        onLoadMore={loadMore}
      />
    </DashboardLayout>
  );
};

export default Comunidade;
