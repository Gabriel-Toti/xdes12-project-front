"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { property, announcement, match } from "@/utils/api";
import Navbar from "@/components/Navbar";

type Property = {
  id: string;
  name: string;
  type: string;
  address: string;
  costs: string;
  total_vacancies: number;
  total_dorms: number;
  total_bathrooms: number;
  garage: boolean;
  external_area: boolean;
  created_at: string;
  image_url?: string | null;
  images?: Array<{
    image_url: string;
  }>;
  rules: Array<{ name: string; value: string }>;
  active_announcements: number;
};

type AnnouncementWithMatches = {
  id_property: string;
  number: number;
  title: string;
  matches: Array<{
    users: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
    accepted: boolean | null;
  }>;
};

export default function Imoveis() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [announcementsWithMatches, setAnnouncementsWithMatches] = useState<Record<string, AnnouncementWithMatches[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [processingMatches, setProcessingMatches] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await property.list();
      setProperties(data);
      
      // Carregar anúncios e matches para cada imóvel
      const announcementsMap: Record<string, AnnouncementWithMatches[]> = {};
      for (const prop of data) {
        try {
          const announcements = await announcement.list(prop.id);
          announcementsMap[prop.id] = announcements;
        } catch (err) {
          console.error(`Erro ao carregar anúncios do imóvel ${prop.id}:`, err);
          announcementsMap[prop.id] = [];
        }
      }
      setAnnouncementsWithMatches(announcementsMap);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        router.push("/login");
        return;
      }
      setError(
        err?.response?.data?.error || err?.message || "Erro ao carregar imóveis"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await property.delete(id);
      await loadProperties();
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || "Erro ao excluir imóvel";
      alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAcceptMatch = async (propertyId: string, number: number, matchUserId: string) => {
    const matchKey = `${propertyId}-${number}-${matchUserId}`;
    setProcessingMatches(prev => new Set(prev).add(matchKey));
    setError(null);
    
    try {
      await match.update(propertyId, number, {
        accepted: true,
        matchUserId: matchUserId
      });
      await loadProperties();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erro ao aceitar match');
    } finally {
      setProcessingMatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(matchKey);
        return newSet;
      });
    }
  };

  const handleRejectMatch = async (propertyId: string, number: number, matchUserId: string) => {
    if (!confirm('Tem certeza que deseja recusar este match?')) {
      return;
    }

    const matchKey = `${propertyId}-${number}-${matchUserId}`;
    setProcessingMatches(prev => new Set(prev).add(matchKey));
    setError(null);
    
    try {
      await match.delete(propertyId, number, matchUserId);
      await loadProperties();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erro ao recusar match');
    } finally {
      setProcessingMatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(matchKey);
        return newSet;
      });
    }
  };

  const formatType = (type: string) => {
    const map: Record<string, string> = {
      CASA: "Casa",
      APARTAMENTO: "Apartamento",
      REPUBLICA: "República",
      PENSAO: "Pensão",
    };
    return map[type] || type;
  };

  if (loading) {
    return (
      <div className="cadastro-page">
        <div className="cadastro-container">
          <div>Carregando imóveis...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <div className="cadastro-page">
          <div className="cadastro-container">
            <div className="cadastro-header">
              <h2>CASAR</h2>
              <h3>Meus Imóveis</h3>
            </div>

        {error && <div className="error-message">{error}</div>}

        {properties.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>Você ainda não possui imóveis cadastrados.</p>
            <Link
              href="/imovel"
              className="btn btn-primary"
              style={{ marginTop: "1rem", color: "white" }}
            >
              Cadastrar Primeiro Imóvel
            </Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <Link
                href="/anuncio"
                className="btn btn-primary"
                style={{ color: "white" }}
              >
                Cadastrar Anúncio
              </Link>
              <Link
                href="/imovel"
                className="btn btn-primary"
                style={{ color: "white" }}
              >
                Cadastrar Novo Imóvel
              </Link>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {properties.map((prop) => (
                <div key={prop.id} className="card">
                  {/* Header com imagem e informações principais */}
                  <div
                    className="property-header-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: prop.image_url ? "250px 1fr" : "1fr",
                      gap: "1.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    {(() => {
                      const propertyImages = prop.images?.map((img: any) => img.image_url) || [];
                      const firstImage = propertyImages[0] || prop.image_url;
                      
                      if (firstImage) {
                        return (
                          <div style={{ width: "100%" }}>
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${firstImage}`}
                              alt={prop.name}
                              style={{
                                width: "100%",
                                height: "200px",
                                objectFit: "cover",
                                borderRadius: "8px",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                              }}
                            />
                            {propertyImages.length > 1 && (
                              <div style={{ 
                                marginTop: "0.5rem", 
                                fontSize: "0.875rem", 
                                color: "#666",
                                textAlign: "center"
                              }}>
                                +{propertyImages.length - 1} foto{propertyImages.length - 1 > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <div>
                      <h4 style={{ marginBottom: "0.5rem", fontSize: "1.5rem", color: "#333" }}>{prop.name}</h4>
                      <p style={{ color: "#666", marginBottom: "0.75rem", fontSize: "1rem" }}>
                        {formatType(prop.type)} • {prop.address}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: "1rem",
                          flexWrap: "wrap",
                          marginBottom: "0.75rem",
                          padding: "0.75rem",
                          background: "#f9fafb",
                          borderRadius: "6px",
                        }}
                      >
                        <span style={{ fontWeight: "500" }}>Vagas: {prop.total_vacancies}</span>
                        <span style={{ fontWeight: "500" }}>Quartos: {prop.total_dorms}</span>
                        <span style={{ fontWeight: "500" }}>Banheiros: {prop.total_bathrooms}</span>
                        {prop.garage && <span style={{ fontWeight: "500" }}>✓ Garagem</span>}
                        {prop.external_area && <span style={{ fontWeight: "500" }}>✓ Área Externa</span>}
                      </div>
                      <p style={{ color: "#666", marginBottom: "0.5rem", fontSize: "1rem" }}>
                        <strong>Custos:</strong> {prop.costs}
                      </p>
                    </div>
                  </div>

                  {/* Regras */}
                  {prop.rules.length > 0 && (
                    <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "#f9fafb", borderRadius: "6px" }}>
                      <strong style={{ display: "block", marginBottom: "0.5rem" }}>Regras:</strong>
                      <ul
                        style={{
                          marginLeft: "1.5rem",
                          marginTop: "0.25rem",
                          listStyle: "disc",
                        }}
                      >
                        {prop.rules.map((r, idx) => (
                          <li key={idx} style={{ marginBottom: "0.25rem" }}>
                            {r.name}: {r.value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Anúncios e Botões de Ação */}
                  <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      {announcementsWithMatches[prop.id] && announcementsWithMatches[prop.id].length > 0 && (
                        <div style={{ marginTop: "1rem", padding: "1rem", background: "#f3f4f6", borderRadius: "8px" }}>
                          <strong style={{ display: "block", marginBottom: "0.5rem" }}>
                            Anúncios e Matches Recebidos:
                          </strong>
                          {announcementsWithMatches[prop.id].map((ann) => {
                            const matchesCount = ann.matches?.length || 0;
                            return (
                              <div key={`${ann.id_property}-${ann.number}`} style={{ marginBottom: "1rem", padding: "0.75rem", background: "white", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                  <div style={{ fontWeight: "600", flex: 1 }}>
                                    {ann.title}
                                  </div>
                                  <Link
                                    href={`/anuncio/${ann.id_property}/${ann.number}`}
                                    className="btn btn-primary"
                                    style={{ 
                                      color: "white",
                                      padding: "6px 12px",
                                      fontSize: "0.875rem",
                                      textDecoration: "none",
                                      whiteSpace: "nowrap",
                                      marginLeft: "0.5rem"
                                    }}
                                  >
                                    Ver Anúncio
                                  </Link>
                                </div>
                                {matchesCount > 0 ? (
                                  <div>
                                    <div style={{ color: "#059669", fontWeight: "600", marginBottom: "0.5rem" }}>
                                      ❤️ {matchesCount} match{matchesCount > 1 ? 'es' : ''} recebido{matchesCount > 1 ? 's' : ''}
                                    </div>
                                    <ul style={{ marginLeft: "1.5rem", marginTop: "0.25rem" }}>
                                      {ann.matches.map((m, idx) => {
                                        const matchKey = `${ann.id_property}-${ann.number}-${m.users.id}`;
                                        const isProcessing = processingMatches.has(matchKey);
                                        const isAccepted = m.accepted === true;
                                        
                                        return (
                                          <li key={idx} style={{ fontSize: "0.9rem", marginBottom: "0.75rem", padding: "0.5rem", background: isAccepted ? "#d1fae5" : "#f9fafb", borderRadius: "4px", border: "1px solid #e5e7eb" }}>
                                            <div style={{ marginBottom: "0.5rem" }}>
                                              <strong>Email:</strong> {m.users.email}
                                              {m.users.name && (
                                                <span style={{ color: "#666", marginLeft: "0.5rem" }}>
                                                  ({m.users.name})
                                                </span>
                                              )}
                                              {isAccepted && (
                                                <>
                                                  <span style={{ color: "#059669", marginLeft: "0.5rem", fontWeight: "600" }}>
                                                    ✓ Aceito
                                                  </span>
                                                  {m.users.phone && (
                                                    <div style={{ marginTop: "0.25rem", color: "#059669", fontWeight: "600" }}>
                                                      📞 Telefone: {m.users.phone}
                                                    </div>
                                                  )}
                                                </>
                                              )}
                                            </div>
                                            {!isAccepted && (
                                              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                                                <button
                                                  type="button"
                                                  onClick={() => handleAcceptMatch(ann.id_property, ann.number, m.users.id)}
                                                  disabled={isProcessing}
                                                  style={{
                                                    padding: "4px 12px",
                                                    background: "#059669",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: isProcessing ? "not-allowed" : "pointer",
                                                    fontSize: "0.875rem"
                                                  }}
                                                >
                                                  {isProcessing ? "Processando..." : "Aceitar"}
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleRejectMatch(ann.id_property, ann.number, m.users.id)}
                                                  disabled={isProcessing}
                                                  style={{
                                                    padding: "4px 12px",
                                                    background: "#ef4444",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: isProcessing ? "not-allowed" : "pointer",
                                                    fontSize: "0.875rem"
                                                  }}
                                                >
                                                  {isProcessing ? "Processando..." : "Recusar"}
                                                </button>
                                              </div>
                                            )}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                ) : (
                                  <div style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                                    Nenhum match recebido ainda
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {(!announcementsWithMatches[prop.id] || announcementsWithMatches[prop.id].length === 0) && (
                        <p style={{ color: "#9ca3af", marginTop: "0.5rem", fontSize: "0.9rem" }}>
                          Nenhum anúncio cadastrado para este imóvel
                        </p>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        flexShrink: 0,
                      }}
                    >
                      <Link
                        href={`/imovel/${prop.id}`}
                        className="btn btn-primary"
                        style={{ padding: "8px 16px", color: "white" }}
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(prop.id)}
                        className="btn btn-secondary"
                        disabled={
                          deletingId === prop.id ||
                          prop.active_announcements > 0
                        }
                        style={{ padding: "8px 16px" }}
                        title={
                          prop.active_announcements > 0
                            ? "Não é possível excluir imóvel com anúncios ativos"
                            : ""
                        }
                      >
                        {deletingId === prop.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {properties.length >= 5 && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  background: "#fef3c7",
                  borderRadius: "8px",
                  color: "#92400e",
                }}
              >
                ⚠ Você atingiu o limite de 5 imóveis cadastrados.
              </div>
            )}
          </>
        )}

        <div className="form-actions" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.push("/conta")}
          >
            Voltar para Conta
          </button>
        </div>
          </div>
        </div>
      </main>
    </div>
  );
}
