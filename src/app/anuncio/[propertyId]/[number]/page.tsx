"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { announcement, user, match, preference } from "@/utils/api";
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
  const [userPreferences, setUserPreferences] = useState<Array<{ name: string; value: string; weight: number }>>([]);
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
      // Carregar anúncio, usuário atual, matches e preferências em paralelo
      const [announcementDataResult, userResult, matchesResult, preferencesResult] = await Promise.allSettled([
        announcement.get(propertyId, number),
        user.me().catch(() => null), // Se não estiver autenticado, retorna null
        match.getAll().catch(() => []), // Se não estiver autenticado, retorna array vazio
        preference.list().catch(() => []) // Se não estiver autenticado ou sem preferências, retorna array vazio
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

      if (preferencesResult.status === 'fulfilled') {
        setUserPreferences(preferencesResult.value || []);
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

  // Função para comparar preferências com regras
  const comparePreferencesWithRules = () => {
    if (!userPreferences || userPreferences.length === 0 || !property || !property.rule || property.rule.length === 0) {
      return null;
    }

    const comparisons: Array<{
      name: string;
      userValue: string | null;
      propertyValue: string;
      compatible: boolean;
    }> = [];

    // Mapear regras do imóvel por nome
    const rulesMap = new Map(property.rule.map((r: any) => [r.attribute.name, r.attribute.value]));

    // Para cada preferência do usuário, verificar se há uma regra correspondente
    userPreferences.forEach(pref => {
      if (rulesMap.has(pref.name)) {
        const propertyValue = rulesMap.get(pref.name);
        if (propertyValue && typeof propertyValue === 'string') {
          const isCompatible = checkCompatibility(pref.name, pref.value, propertyValue);
          
          comparisons.push({
            name: pref.name,
            userValue: pref.value,
            propertyValue: propertyValue,
            compatible: isCompatible
          });
        }
      }
    });

    // Adicionar regras que não têm preferência correspondente
    property.rule.forEach((r: any) => {
      if (!userPreferences.some(p => p.name === r.attribute.name)) {
        comparisons.push({
          name: r.attribute.name,
          userValue: null,
          propertyValue: r.attribute.value,
          compatible: false
        });
      }
    });

    return comparisons;
  };

  // Função auxiliar para verificar compatibilidade entre valores
  const checkCompatibility = (name: string, userValue: string, propertyValue: string): boolean => {
    // Para campos de múltipla escolha (como Estilo de Convivência, Hobbies)
    if (userValue.includes(',') || propertyValue.includes(',')) {
      const userValues = userValue.split(',').map(v => v.trim().toLowerCase());
      const propertyValues = propertyValue.split(',').map(v => v.trim().toLowerCase());
      // Verifica se há alguma interseção
      return userValues.some(uv => propertyValues.includes(uv));
    }

    // Para horários (formato: "22h-08h; 14h-16h")
    if (name.toLowerCase().includes('horário') || name.toLowerCase().includes('silêncio')) {
      return true; // Considera compatível se ambos têm valores definidos
    }

    // Para localização (distância em km)
    if (name.toLowerCase().includes('localização') || name.toLowerCase().includes('distância')) {
      const userDist = parseFloat(userValue);
      const propertyDist = parseFloat(propertyValue);
      if (!isNaN(userDist) && !isNaN(propertyDist)) {
        return propertyDist <= userDist; // Propriedade está dentro do raio aceitável
      }
    }

    // Para outros campos, verifica igualdade exata (case-insensitive)
    return userValue.trim().toLowerCase() === propertyValue.trim().toLowerCase();
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
                ⭐ PATROCINADO
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

          {/* Seção de Comparação de Preferências vs Regras */}
          {currentUser && !isAdmin && userPreferences.length > 0 && (() => {
            const comparisons = comparePreferencesWithRules();
            if (!comparisons || comparisons.length === 0) return null;

            const compatibleCount = comparisons.filter(c => c.compatible).length;
            const totalCount = comparisons.length;

            return (
              <div className="card" style={{ 
                padding: "1.5rem", 
                marginBottom: "1.5rem",
                border: `2px solid ${compatibleCount / totalCount >= 0.7 ? "#10b981" : compatibleCount / totalCount >= 0.4 ? "#f59e0b" : "#ef4444"}`
              }}>
                <h4 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>🔍</span>
                  <span>Comparação Detalhada: Suas Preferências vs Regras do Imóvel</span>
                </h4>
                
                <div style={{ 
                  padding: "1rem", 
                  background: compatibleCount / totalCount >= 0.7 ? "#f0fdf4" : compatibleCount / totalCount >= 0.4 ? "#fffbeb" : "#fef2f2",
                  borderRadius: "8px",
                  marginBottom: "1rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: "600" }}>
                      {compatibleCount} de {totalCount} critérios compatíveis
                    </span>
                    <span style={{ 
                      fontSize: "1.5rem", 
                      fontWeight: "bold",
                      color: compatibleCount / totalCount >= 0.7 ? "#059669" : compatibleCount / totalCount >= 0.4 ? "#d97706" : "#dc2626"
                    }}>
                      {Math.round((compatibleCount / totalCount) * 100)}%
                    </span>
                  </div>
                  <div style={{ 
                    width: "100%", 
                    height: "12px", 
                    background: "#e5e7eb", 
                    borderRadius: "6px", 
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${(compatibleCount / totalCount) * 100}%`,
                      height: "100%",
                      background: compatibleCount / totalCount >= 0.7 ? "#10b981" : compatibleCount / totalCount >= 0.4 ? "#f59e0b" : "#ef4444",
                      borderRadius: "6px",
                      transition: "width 0.5s ease"
                    }} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {comparisons.map((comp, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        padding: "1rem",
                        background: comp.compatible ? "#f0fdf4" : "#fef2f2",
                        borderRadius: "8px",
                        border: `2px solid ${comp.compatible ? "#10b981" : "#ef4444"}`
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                        <div style={{ 
                          fontSize: "1.5rem",
                          flexShrink: 0,
                          marginTop: "-2px"
                        }}>
                          {comp.compatible ? "✅" : "❌"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: "bold", 
                            marginBottom: "0.5rem",
                            color: comp.compatible ? "#065f46" : "#991b1b"
                          }}>
                            {comp.name}
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.875rem" }}>
                            <div>
                              <div style={{ color: "#666", marginBottom: "0.25rem" }}>Sua preferência:</div>
                              <div style={{ 
                                fontWeight: "600",
                                color: comp.userValue ? "#111" : "#999"
                              }}>
                                {comp.userValue || "Não definida"}
                              </div>
                            </div>
                            <div>
                              <div style={{ color: "#666", marginBottom: "0.25rem" }}>Regra do imóvel:</div>
                              <div style={{ fontWeight: "600" }}>
                                {comp.propertyValue}
                              </div>
                            </div>
                          </div>
                          {!comp.compatible && comp.userValue && (
                            <div style={{ 
                              marginTop: "0.5rem", 
                              fontSize: "0.75rem", 
                              color: "#991b1b",
                              fontStyle: "italic"
                            }}>
                              ⚠️ Este critério pode não atender suas expectativas
                            </div>
                          )}
                          {comp.compatible && (
                            <div style={{ 
                              marginTop: "0.5rem", 
                              fontSize: "0.75rem", 
                              color: "#065f46",
                              fontStyle: "italic"
                            }}>
                              ✓ Este critério está de acordo com suas preferências
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

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

