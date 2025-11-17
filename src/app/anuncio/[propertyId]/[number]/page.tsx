"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { announcement, user } from "@/utils/api";

export default function VerAnuncio() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const number = parseInt(params.number as string);

  const [announcementData, setAnnouncementData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
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
      // Carregar anúncio e usuário atual em paralelo
      const [announcementDataResult, userResult] = await Promise.allSettled([
        announcement.get(propertyId, number),
        user.me().catch(() => null) // Se não estiver autenticado, retorna null
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
        setError(err?.response?.data?.error || err?.message || "Erro ao carregar anúncio");
      }

      if (userResult.status === 'fulfilled' && userResult.value) {
        setCurrentUser(userResult.value);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Erro ao carregar dados");
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
          <h2>CASAR</h2>
          <h3>{announcementData.title}</h3>
          {announcementData.boost && (
            <span
              style={{
                background: "#f59e0b",
                color: "white",
                padding: "4px 12px",
                borderRadius: "4px",
                fontSize: "0.875rem",
                fontWeight: "bold",
                marginTop: "0.5rem",
                display: "inline-block"
              }}
            >
              ⭐ ANÚNCIO EM DESTAQUE (BOOST)
            </span>
          )}
        </div>

        <div className="cadastro-form">
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

          {announcementData.matches && announcementData.matches.length > 0 && (
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
              <h4 style={{ marginBottom: "1rem" }}>Candidatos ({announcementData.matches.length})</h4>
              <ul>
                {announcementData.matches.map((match: any, idx: number) => (
                  <li key={idx} style={{ marginBottom: "0.5rem" }}>
                    {match.users.name} ({match.users.email})
                    {match.accepted && (
                      <span style={{ color: "#059669", marginLeft: "0.5rem" }}>✓ Aceito</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-actions">
            {isAdmin && (
              <Link
                href={`/anuncio/${propertyId}/${number}/editar`}
                className="btn btn-primary"
                style={{ color: "white" }}
              >
                Editar Anúncio
              </Link>
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

