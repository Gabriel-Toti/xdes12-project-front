"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { announcement, user, match } from "@/utils/api";
import { getErrorMessage } from "@/utils/error-handler";

function ImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <img
          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${images[0]}`}
          alt={title}
          style={{
            width: "100%",
            maxHeight: "500px",
            objectFit: "cover",
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "1.5rem", position: "relative" }}>
      <div style={{ position: "relative", width: "100%", borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
        <img
          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${images[currentIndex]}`}
          alt={`${title} - Imagem ${currentIndex + 1}`}
          style={{
            width: "100%",
            height: "500px",
            objectFit: "cover",
            display: "block"
          }}
        />
        
        {/* Botões de navegação */}
        <button
          onClick={prevImage}
          style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(0, 0, 0, 0.6)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            fontWeight: "bold",
            zIndex: 2
          }}
          aria-label="Imagem anterior"
        >
          ‹
        </button>
        
        <button
          onClick={nextImage}
          style={{
            position: "absolute",
            right: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(0, 0, 0, 0.6)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            fontWeight: "bold",
            zIndex: 2
          }}
          aria-label="Próxima imagem"
        >
          ›
        </button>

        {/* Indicadores */}
        <div style={{
          position: "absolute",
          bottom: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "8px",
          zIndex: 2
        }}>
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToImage(idx)}
              style={{
                width: currentIndex === idx ? "24px" : "12px",
                height: "12px",
                borderRadius: "6px",
                border: "none",
                background: currentIndex === idx ? "white" : "rgba(255, 255, 255, 0.5)",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              aria-label={`Ir para imagem ${idx + 1}`}
            />
          ))}
        </div>

        {/* Contador */}
        <div style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "rgba(0, 0, 0, 0.6)",
          color: "white",
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "14px",
          fontWeight: "500",
          zIndex: 2
        }}>
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}

export default function VerAnuncio() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const number = parseInt(params.number as string);

  const [announcementData, setAnnouncementData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userMatches, setUserMatches] = useState<Array<{ id_user: string; id_property: string; number_announcement: number; [key: string]: any }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propertyId && number) {
      loadData();
    }
  }, [propertyId, number]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Carregar anúncio, usuário atual e matches em paralelo
      const [announcementDataResult, userResult, matchesResult] = await Promise.allSettled([
        announcement.get(propertyId, number),
        user.me().catch(() => null), // Se não estiver autenticado, retorna null
        match.getAll().catch(() => []) // Se não estiver autenticado, retorna array vazio
      ]);

      if (announcementDataResult.status === 'fulfilled') {
        setAnnouncementData(announcementDataResult.value);
      } else {
        const err = announcementDataResult.reason;
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          router.push("/login");
          return;
        }
        setError(getErrorMessage(err, "Erro ao carregar anúncio"));
      }

      if (userResult.status === 'fulfilled' && userResult.value) {
        setCurrentUser(userResult.value);
      }

      if (matchesResult.status === 'fulfilled') {
        setUserMatches(matchesResult.value || []);
      }
    } catch (err: any) {
      setError(getErrorMessage(err, "Erro ao carregar dados"));
    } finally {
      setLoading(false);
    }
  };

  const [isMatching, setIsMatching] = useState(false);
  const [matchSuccess, setMatchSuccess] = useState<string | null>(null);

  const hasMatch = (): boolean => {
    return userMatches.some(
      m => m.id_property === propertyId && m.number_announcement === number
    );
  };

  const getMatchUserId = (): string | null => {
    const match = userMatches.find(
      m => m.id_property === propertyId && m.number_announcement === number
    );
    return match ? match.id_user : null;
  };

  const handleMatch = async () => {
    if (!currentUser) {
      router.push(`/login?redirect=/anuncio/${propertyId}/${number}`);
      return;
    }

    const isMatched = hasMatch();
    setIsMatching(true);
    setError(null);
    setMatchSuccess(null);

    try {
      if (isMatched) {
        // Deletar match existente
        const matchUserId = getMatchUserId();
        if (matchUserId) {
          await match.delete(propertyId, number, matchUserId);
          setMatchSuccess(null);
          // Recarregar matches
          const updatedMatches = await match.getAll().catch(() => []);
          setUserMatches(updatedMatches || []);
        }
      } else {
        // Criar novo match
        await match.create({ id_property: propertyId, number_announcement: number });
        setMatchSuccess("created");
        setTimeout(() => setMatchSuccess(null), 3000);
        // Recarregar matches
        const updatedMatches = await match.getAll().catch(() => []);
        setUserMatches(updatedMatches || []);
      }
    } catch (err: any) {
      setError(getErrorMessage(err, isMatched ? 'Erro ao remover match' : 'Erro ao registrar match'));
    } finally {
      setIsMatching(false);
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

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="cadastro-page">
        <div className="cadastro-container">
          <div>Carregando anúncio...</div>
        </div>
      </div>
    );
  }

  if (error || !announcementData) {
    return (
      <div className="cadastro-page">
        <div className="cadastro-container">
          <div className="error-message">{error || "Anúncio não encontrado"}</div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.push("/")}
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  const property = announcementData.property;
  
  // Verificar se o usuário logado é admin/responsável do imóvel
  const isAdmin = currentUser && property?.participation?.some(
    (p: any) => p.id_user === currentUser.id && p.admin === true
  );

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div style={{ flex: 1 }}>
              <h2>CASAR</h2>
              <h3>{announcementData.title}</h3>
            </div>
            {/* Botão de Editar - aparece apenas para admins - posicionado no topo */}
            {isAdmin && (
              <Link
                href={`/anuncio/${propertyId}/${number}/editar`}
                className="btn btn-primary"
                style={{ 
                  color: "white",
                  fontSize: "1rem",
                  padding: "10px 20px",
                  fontWeight: "600",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.3s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                }}
              >
                ✏️ Editar
              </Link>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginTop: "0.5rem" }}>
            {announcementData.boost && (
              <span
                style={{
                  background: "#f59e0b",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  fontWeight: "bold",
                  display: "inline-block"
                }}
              >
                ⭐ ANÚNCIO EM DESTAQUE (BOOST)
              </span>
            )}
            {announcementData.compatibility !== undefined && announcementData.compatibility !== null && currentUser && !isAdmin && (
              <div
                style={{
                  background: announcementData.compatibility >= 0.7 ? "#10b981" : announcementData.compatibility >= 0.4 ? "#f59e0b" : "#ef4444",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <span style={{ fontSize: "1.25rem" }}>🎯</span>
                <div>
                  <div style={{ fontSize: "1rem" }}>Compatibilidade</div>
                  <div style={{ fontSize: "1.5rem" }}>{announcementData.compatibility}%</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="cadastro-form">
          {(() => {
            // Prioridade: imagens do anúncio > primeira imagem do anúncio > imagens da propriedade > primeira imagem da propriedade
            const announcementImages = announcementData.images?.map((img: any) => img.image_url) || [];
            const propertyImages = property?.images?.map((img: any) => img.image_url) || [];
            const allImages = [
              ...announcementImages,
              ...(announcementData.image_url && !announcementImages.includes(announcementData.image_url) ? [announcementData.image_url] : []),
              ...propertyImages,
              ...(property?.image_url && !propertyImages.includes(property.image_url) && !announcementImages.includes(property.image_url) ? [property.image_url] : [])
            ].filter(Boolean);

            if (allImages.length > 0) {
              return <ImageCarousel images={allImages} title={announcementData.title} />;
            }
            return null;
          })()}
          {announcementData.compatibility !== undefined && announcementData.compatibility !== null && currentUser && !isAdmin && (
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem", background: announcementData.compatibility >= 0.7 ? "#f0fdf4" : announcementData.compatibility >= 0.4 ? "#fffbeb" : "#fef2f2" }}>
              <h4 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🎯</span>
                <span>Compatibilidade com suas Preferências</span>
              </h4>
              <div style={{ marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "2rem", fontWeight: "bold", color: announcementData.compatibility >= 0.7 ? "#059669" : announcementData.compatibility >= 0.4 ? "#d97706" : "#dc2626" }}>
                    {announcementData.compatibility}%
                  </span>
                  <span style={{ fontSize: "0.875rem", color: "#666" }}>
                    {announcementData.compatibility >= 0.7 ? "Alta compatibilidade" : announcementData.compatibility >= 0.4 ? "Compatibilidade média" : "Baixa compatibilidade"}
                  </span>
                </div>
                <div style={{ 
                  width: "100%", 
                  height: "24px", 
                  background: "#e5e7eb", 
                  borderRadius: "12px", 
                  overflow: "hidden",
                  position: "relative"
                }}>
                  <div style={{
                    width: `${announcementData.compatibility}%`,
                    height: "100%",
                    background: announcementData.compatibility >= 0.7 ? "#10b981" : announcementData.compatibility >= 0.4 ? "#f59e0b" : "#ef4444",
                    borderRadius: "12px",
                    transition: "width 0.5s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: "8px"
                  }}>
                    {announcementData.compatibility >= 0.5 && (
                      <span style={{ color: "white", fontSize: "0.75rem", fontWeight: "bold" }}>
                        {announcementData.compatibility}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: "0.875rem", color: "#666", margin: 0 }}>
                Este anúncio foi classificado com base na compatibilidade entre suas preferências e as regras do imóvel, 
                {announcementData.compatibility >= 0.7 ? " mostrando uma excelente correspondência!" : announcementData.compatibility >= 0.4 ? " indicando uma correspondência moderada." : " indicando uma correspondência limitada."}
              </p>
            </div>
          )}

          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h4 style={{ marginBottom: "1rem" }}>Informações do Anúncio</h4>
            {announcementData.description && (
              <p style={{ marginBottom: "1rem", color: "#555" }}>{announcementData.description}</p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div>
                <strong>Valor:</strong>
                <p style={{ fontSize: "1.25rem", color: "#059669", fontWeight: "bold" }}>
                  R$ {announcementData.average_cost.toLocaleString("pt-BR")} / mês
                </p>
              </div>
              <div>
                <strong>Vagas disponíveis:</strong>
                <p style={{ fontSize: "1.25rem" }}>{announcementData.vacancies}</p>
              </div>
              <div>
                <strong>Publicado em:</strong>
                <p>{formatDate(announcementData.created_at)}</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h4 style={{ marginBottom: "1rem" }}>Informações do Imóvel</h4>
            <p><strong>Nome:</strong> {property.name}</p>
            <p><strong>Tipo:</strong> {formatType(property.type)}</p>
            <p><strong>Endereço:</strong> {property.address}</p>
            {property.rule && property.rule.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <strong>Regras do Imóvel:</strong>
                <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
                  {property.rule.map((r: any, idx: number) => (
                    <li key={idx}>
                      {r.attribute.name}: {r.attribute.value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {matchSuccess === "created" && (
            <div className="success-message" style={{ marginBottom: "1rem", padding: "1rem", background: "#d1fae5", color: "#065f46", borderRadius: "8px" }}>
              ✓ Match realizado com sucesso! Seu email foi registrado.
            </div>
          )}

          <div className="form-actions" style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            {/* Botão de Match - aparece sempre que o usuário NÃO é admin do imóvel */}
            {!isAdmin && (
              <>
                {currentUser ? (
                  (() => {
                    const isMatched = hasMatch();
                    return (
                      <button
                        type="button"
                        onClick={handleMatch}
                        disabled={isMatching}
                        style={{
                          fontSize: "2rem",
                          background: "none",
                          border: "none",
                          cursor: isMatching ? "default" : "pointer",
                          color: isMatched ? "#ef4444" : "#9ca3af",
                          transition: "transform 0.2s",
                          padding: "0.5rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                        onMouseEnter={(e) => {
                          if (!isMatching) {
                            e.currentTarget.style.transform = "scale(1.2)";
                            e.currentTarget.style.color = isMatched ? "#dc2626" : "#ef4444";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isMatching) {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.color = isMatched ? "#ef4444" : "#9ca3af";
                          }
                        }}
                        title={isMatched ? "Remover match deste anúncio" : "Dar match neste anúncio"}
                      >
                        {isMatching ? "⏳" : isMatched ? "❤️" : "🤍"}
                      </button>
                    );
                  })()
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => router.push('/login')}
                    style={{ color: "white" }}
                  >
                    Faça login para dar match
                  </button>
                )}
              </>
            )}
            
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push("/")}
            >
              Voltar para Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

