"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { announcement, user, match, property } from "../utils/api";
import Navbar from "../components/Navbar";

type Announcement = {
  id_property: string;
  number: number;
  title: string;
  description: string | null;
  average_cost: number;
  boost: boolean | null;
  vacancies: number;
  created_at: string | null;
  compatibility?: number;
  image_url?: string | null;
  images?: Array<{
    image_url: string;
  }>;
  property: {
    id: string;
    name: string;
    type: string;
    address: string;
    image_url?: string | null;
    images?: Array<{
      image_url: string;
    }>;
    participation?: Array<{
      id_user: string;
      admin: boolean;
    }>;
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
  const [userMatches, setUserMatches] = useState<Array<{ id_user: string; id_property: string; number_announcement: number; [key: string]: any }>>([]);
  const [userProperties, setUserProperties] = useState<Array<{ id: string }>>([]);
  const [matchingIds, setMatchingIds] = useState<Set<string>>(new Set());
  const [matchSuccess, setMatchSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Carregar anúncios primeiro (sem compatibilidade)
    loadAnnouncements();
    // Depois tentar carregar usuário (que pode recarregar anúncios com compatibilidade)
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = await user.me();
      setCurrentUser(userData);
      // Carregar matches e propriedades do usuário
      await Promise.all([
        loadUserMatches(),
        loadUserProperties()
      ]);
      // Recarregar anúncios para obter compatibilidade (passa o usuário como parâmetro)
      await loadAnnouncements(userData);
    } catch (err) {
      // Usuário não está autenticado, não faz nada
      setCurrentUser(null);
      setUserMatches([]);
      setUserProperties([]);
      // Carregar anúncios sem compatibilidade
      await loadAnnouncements();
    }
  };

  const loadUserProperties = async () => {
    try {
      const properties = await property.list();
      setUserProperties(properties || []);
    } catch (err) {
      console.error("Erro ao carregar propriedades:", err);
      setUserProperties([]);
    }
  };

  const loadUserMatches = async () => {
    try {
      const matches = await match.getAll();
      setUserMatches(matches || []);
    } catch (err) {
      console.error("Erro ao carregar matches:", err);
      setUserMatches([]);
    }
  };

  const loadAnnouncements = async (user?: any) => {
    setLoading(true);
    setError(null);
    try {
      // Se o usuário está logado, usa a rota autenticada para obter compatibilidade
      // Caso contrário, usa a rota pública
      const userToCheck = user !== undefined ? user : currentUser;
      let data;
      if (userToCheck) {
        try {
          data = await announcement.list();
        } catch (err) {
          // Se falhar a rota autenticada, tenta a pública
          data = await announcement.listPublic();
        }
      } else {
        data = await announcement.listPublic();
      }
      
      // Garantir que data é um array
      const announcementsArray = Array.isArray(data) ? data : [];
      
      // O backend já ordena corretamente, mas aplicamos a mesma lógica aqui para garantir
      // que a ordenação seja consistente mesmo se houver múltiplas chamadas
      const sorted = [...announcementsArray].sort((a, b) => {
        // Se há compatibilidade, aplicar lógica de boost
        if (userToCheck && a.compatibility !== undefined && b.compatibility !== undefined) {
          const aCompat = a.compatibility ?? 0;
          const bCompat = b.compatibility ?? 0;
          
          const aHasBoost = a.boost === true;
          const bHasBoost = b.boost === true;
          
          // Calcular diferença absoluta de compatibilidade
          const compatDiffAbs = Math.abs(aCompat - bCompat);
          
          // Se a diferença é maior que 4 pontos, ordenar apenas por compatibilidade
          if (compatDiffAbs > 4) {
            return bCompat - aCompat; // Maior compatibilidade primeiro
          }
          
          // Se a diferença é <= 4 pontos, aplicar boost
          // Anúncios com boost aparecem antes de anúncios sem boost
          if (aHasBoost && !bHasBoost) {
            return -1; // A tem boost, aparece primeiro
          }
          if (!aHasBoost && bHasBoost) {
            return 1; // B tem boost, aparece primeiro
          }
          
          // Se ambos têm ou não têm boost, ordenar por compatibilidade
          if (aCompat !== bCompat) {
            return bCompat - aCompat; // Maior compatibilidade primeiro
          }
        } else {
          // Se não há compatibilidade, ordenar por boost e data
          const aBoost = a.boost === true ? 1 : 0;
          const bBoost = b.boost === true ? 1 : 0;
          if (aBoost !== bBoost) {
            return bBoost - aBoost; // Boost primeiro
          }
        }
        
        // Por fim, ordenar por data (mais recentes primeiro)
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
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

  const hasMatch = (propertyId: string, number: number): boolean => {
    return userMatches.some(
      m => m.id_property === propertyId && m.number_announcement === number
    );
  };

  const getMatchUserId = (propertyId: string, number: number): string | null => {
    const match = userMatches.find(
      m => m.id_property === propertyId && m.number_announcement === number
    );
    return match ? match.id_user : null;
  };

  const handleMatch = async (propertyId: string, number: number) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    const matchKey = `${propertyId}-${number}`;
    const isMatched = hasMatch(propertyId, number);
    
    setMatchingIds(prev => new Set(prev).add(matchKey));
    setError(null);
    setMatchSuccess(null);

    try {
      if (isMatched) {
        // Deletar match existente
        const matchUserId = getMatchUserId(propertyId, number);
        if (matchUserId) {
          await match.delete(propertyId, number, matchUserId);
          setMatchSuccess(null);
          // Recarregar matches
          await loadUserMatches();
        }
      } else {
        // Criar novo match
        await match.create({ id_property: propertyId, number_announcement: number });
        setMatchSuccess(matchKey);
        setTimeout(() => setMatchSuccess(null), 3000);
        // Recarregar matches
        await loadUserMatches();
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || (isMatched ? 'Erro ao remover match' : 'Erro ao registrar match'));
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
      <Navbar />

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
              {!currentUser && (
                <Link href="/login" className="btn btn-primary" style={{ marginTop: "1rem", color: "white" }}>
                  Faça login para criar anúncios
                </Link>
              )}
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
                    {(() => {
                      // Prioridade: imagens do anúncio > primeira imagem do anúncio > imagens da propriedade > primeira imagem da propriedade
                      const announcementImages = ann.images?.map((img: any) => img.image_url) || [];
                      const propertyImages = ann.property?.images?.map((img: any) => img.image_url) || [];
                      const firstImage = announcementImages[0] || ann.image_url || propertyImages[0] || ann.property?.image_url;
                      
                      if (firstImage) {
                        return (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${firstImage}`}
                            alt={ann.title}
                            style={{
                              width: 220,
                              height: 140,
                              objectFit: "cover",
                              borderRadius: 8,
                              flexShrink: 0
                            }}
                          />
                        );
                      }
                      return (
                        <div style={{ width: 220, height: 140, background: "#f0f0f0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", flexShrink: 0 }}>
                          Sem foto
                        </div>
                      );
                    })()}

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
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
                        {ann.compatibility !== undefined && ann.compatibility !== null && currentUser && !userProperties.some(p => p.id === ann.id_property) && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span
                              style={{
                                background: ann.compatibility >= 0.7 ? "#10b981" : ann.compatibility >= 0.4 ? "#f59e0b" : "#ef4444",
                                color: "white",
                                padding: "4px 12px",
                                borderRadius: "20px",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem"
                              }}
                              title={`Compatibilidade: ${ann.compatibility}%`}
                            >
                              <span>🎯</span>
                              <span>{ann.compatibility}%</span>
                            </span>
                          </div>
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
                          (() => {
                            // Verificar se o usuário é admin do imóvel
                            // Primeiro tenta pela participation (se disponível), senão verifica pelas propriedades do usuário
                            const isAdmin = ann.property?.participation?.some(
                              (p: any) => p.id_user === currentUser.id && p.admin === true
                            ) || userProperties.some(p => p.id === ann.id_property);
                            
                            // Se for admin, não mostrar o botão de match
                            if (isAdmin) {
                              return null;
                            }

                            const isMatched = hasMatch(ann.id_property, ann.number);
                            const isProcessing = matchingIds.has(`${ann.id_property}-${ann.number}`);
                            return (
                              <button
                                type="button"
                                onClick={() => handleMatch(ann.id_property, ann.number)}
                                disabled={isProcessing}
                                style={{
                                  fontSize: "1.5rem",
                                  background: "none",
                                  border: "none",
                                  cursor: isProcessing ? "default" : "pointer",
                                  color: isMatched ? "#ef4444" : "#9ca3af",
                                  transition: "transform 0.2s",
                                  padding: "0.5rem",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                                onMouseEnter={(e) => {
                                  if (!isProcessing) {
                                    e.currentTarget.style.transform = "scale(1.2)";
                                    e.currentTarget.style.color = isMatched ? "#dc2626" : "#ef4444";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isProcessing) {
                                    e.currentTarget.style.transform = "scale(1)";
                                    e.currentTarget.style.color = isMatched ? "#ef4444" : "#9ca3af";
                                  }
                                }}
                                title={isMatched ? "Remover match deste anúncio" : "Dar match neste anúncio"}
                              >
                                {isProcessing ? "⏳" : isMatched ? "❤️" : "🤍"}
                              </button>
                            );
                          })()
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
