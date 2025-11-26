"use client";

import { useState, useEffect } from "react";
import { notification } from "../utils/api";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUnreadCount();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const data = await notification.getUnreadCount();
      setUnreadCount(data.count);
    } catch (err) {
      // Silenciosamente ignorar erro (usuário pode não estar autenticado)
    }
  };

  const loadNotifications = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await notification.list();
      // Garante que o estado nunca fique "preso" em loading se a API retornar algo inesperado
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    if (!showDropdown) {
      loadNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notification.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      loadUnreadCount();
    } catch (err) {
      console.error("Erro ao marcar como lida:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notification.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}m atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 dia atrás";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleBellClick}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "1.5rem",
          color: "white",
          padding: "0.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        title="Notificações"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              background: "#ef4444",
              color: "white",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: "bold",
              border: "2px solid white"
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Overlay para fechar o dropdown */}
          <div
            onClick={() => setShowDropdown(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
          />

          {/* Dropdown */}
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: "380px",
              maxWidth: "90vw",
              maxHeight: "500px",
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              zIndex: 1000,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1rem",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f9fafb"
              }}
            >
              <h4 style={{ margin: 0, color: "#111" }}>Notificações</h4>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#667eea",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "600"
                  }}
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Content */}
            <div
              style={{
                overflowY: "auto",
                flex: 1
              }}
            >
              {loading ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
                  Carregando...
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid #e5e7eb",
                      background: notif.read ? "white" : "#f0f9ff",
                      cursor: notif.link ? "pointer" : "default",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      if (notif.link) e.currentTarget.style.background = "#e0f2fe";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notif.read ? "white" : "#f0f9ff";
                    }}
                    onClick={() => {
                      if (!notif.read) {
                        handleMarkAsRead(notif.id);
                      }
                      if (notif.link) {
                        setShowDropdown(false);
                        window.location.href = notif.link;
                      }
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                      <div style={{ fontWeight: "bold", color: "#111", fontSize: "0.875rem" }}>
                        {notif.title}
                      </div>
                      {!notif.read && (
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            background: "#3b82f6",
                            borderRadius: "50%",
                            flexShrink: 0,
                            marginLeft: "0.5rem"
                          }}
                        />
                      )}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#999" }}>
                      {getTimeAgo(notif.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

