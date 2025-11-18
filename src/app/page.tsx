"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { announcement, user, match } from "../utils/api";

type Announcement = {
  id_property: string;
  number: number;
  title: string;
  description: string | null;
  average_cost: number;
  boost: boolean | null;
  vacancies: number;
  created_at: string | null;
  property: {
    id: string;
    name: string;
    type: string;
    address: string;
    rule: Array<{
      attribute: {
        name: string;
        value: string;
      };
    }>;
  };
};

export default function Home() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [matchingIds, setMatchingIds] = useState<Set<string>>(new Set());
  const [matchSuccess, setMatchSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAnnouncements();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = await user.me();
      setCurrentUser(userData);
    } catch (err) {
      // Usuário não está autenticado, não faz nada
      setCurrentUser(null);
    }
  };

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      // Usa a rota pública que não requer autenticação
      const data = await announcement.listPublic();
      
      // Backend já ordena por boost e data, mas garantimos aqui também
      const sorted = [...data].sort((a, b) => {
        const aBoost = a.boost === true ? 1 : 0;
        const bBoost = b.boost === true ? 1 : 0;
        if (aBoost !== bBoost) {
          return bBoost - aBoost; // Boost primeiro
        }
        // Se ambos têm ou não têm boost, ordenar por data
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate; // Mais recentes primeiro
      });
      
      setAnnouncements(sorted);
    } catch (err: any) {
      // Não redireciona para login na home, apenas mostra erro silencioso
      console.error("Erro ao carregar anúncios:", err);
      setError("Não foi possível carregar os anúncios.");
    } finally {
      setLoading(false);
    }
  };

  const formatType = (type: string) => {
    const map: Record<string, string> = {
      CASA: "Casa",
      APARTAMENTO: "Apartamento",
      REPUBLICA: "República",
      PENSAO: "Pensão"
    };
    return map[type] || type;
  };

  const handleMatch = async (propertyId: string, number: number) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    const matchKey = `${propertyId}-${number}`;
    setMatchingIds(prev => new Set(prev).add(matchKey));
    setError(null);
    setMatchSuccess(null);

    try {
      await match.create({ id_property: propertyId, number_announcement: number });
      setMatchSuccess(matchKey);
      setTimeout(() => setMatchSuccess(null), 3000);
      // Recarregar anúncios para atualizar a lista
      await loadAnnouncements();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erro ao registrar match');
    } finally {
      setMatchingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(matchKey);
        return newSet;
      });
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>CASAR</h1>
          <nav className="nav-menu">
            <Link className="nav-link" href="/cadastro">Cadastro</Link>
            <Link className="nav-link" href="/login">Login</Link>
            <Link className="nav-link" href="/">Home</Link>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <section style={{ maxWidth: 1200, margin: "1.5rem auto", padding: "0 1rem" }}>
          <h2 className="page-title">Anúncios Disponíveis</h2>

          {error && (
            <div style={{ padding: "1rem", background: "#fee2e2", color: "#991b1b", borderRadius: "8px", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>Carregando anúncios...</div>
          ) : announcements.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p>Nenhum anúncio disponível no momento.</p>
              <Link href="/login" className="btn btn-primary" style={{ marginTop: "1rem", color: "white" }}>
                Faça login para criar anúncios
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {announcements.map((ann) => (
                <div
                  key={`${ann.id_property}-${ann.number}`}
                  className="card"
                  style={{
                    border: ann.boost ? "2px solid #f59e0b" : "1px solid #e5e7eb",
                    background: ann.boost ? "#fffbeb" : "white"
                  }}
                >
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ width: 220, height: 140, background: "#f0f0f0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", flexShrink: 0 }}>
                      Foto do imóvel
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                        <div className="card-title">{ann.title}</div>
                        {ann.boost && (
                          <span
                            style={{
                              background: "#f59e0b",
                              color: "white",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: "bold"
                            }}
                          >
                            BOOST
                          </span>
                        )}
                      </div>
                      <div className="card-subtitle" style={{ marginBottom: 8 }}>
                        {ann.property.name} • {formatType(ann.property.type)}
                      </div>
                      {ann.description && (
                        <p style={{ color: "#555", marginBottom: 8 }}>{ann.description}</p>
                      )}

                      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, color: "#333" }}>
                          R$ {ann.average_cost.toLocaleString("pt-BR")} / mês
                        </div>
                        <div style={{ color: "#666" }}>Vagas: {ann.vacancies}</div>
                        <div style={{ color: "#666", fontSize: "0.875rem" }}>
                          {ann.property.address}
                        </div>
                      </div>

                      <div style={{ marginTop: 12, display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        {matchSuccess === `${ann.id_property}-${ann.number}` && (
                          <span style={{ 
                            fontSize: "0.75rem", 
                            color: "#059669", 
                            fontWeight: "600",
                            padding: "4px 8px",
                            background: "#d1fae5",
                            borderRadius: "4px"
                          }}>
                            ✓ Match realizado!
                          </span>
                        )}
                        {currentUser ? (
                          <button
                            type="button"
                            onClick={() => handleMatch(ann.id_property, ann.number)}
                            disabled={matchingIds.has(`${ann.id_property}-${ann.number}`)}
                            style={{
                              fontSize: "1.5rem",
                              background: "none",
                              border: "none",
                              cursor: matchingIds.has(`${ann.id_property}-${ann.number}`) ? "default" : "pointer",
                              color: "#9ca3af",
                              transition: "transform 0.2s",
                              padding: "0.5rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                            onMouseEnter={(e) => {
                              if (!matchingIds.has(`${ann.id_property}-${ann.number}`)) {
                                e.currentTarget.style.transform = "scale(1.2)";
                                e.currentTarget.style.color = "#ef4444";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!matchingIds.has(`${ann.id_property}-${ann.number}`)) {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.color = "#9ca3af";
                              }
                            }}
                            title="Dar match neste anúncio"
                          >
                            {matchingIds.has(`${ann.id_property}-${ann.number}`) ? "⏳" : "🤍"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => router.push('/login')}
                            className="btn btn-secondary"
                            style={{ padding: "4px 12px", fontSize: "0.875rem" }}
                          >
                            Login para match
                          </button>
                        )}
                        <Link
                          href={`/anuncio/${ann.id_property}/${ann.number}`}
                          className="btn btn-primary"
                          style={{ color: "white" }}
                        >
                          Ver anúncio
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
