"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { announcement, property, user } from "@/utils/api";

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

export default function Anuncios() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProperties, setHasProperties] = useState<boolean | null>(null);

  useEffect(() => {
    checkUserProperties();
  }, []);

  const checkUserProperties = async () => {
    try {
      const properties = await property.list();
      setHasProperties(properties.length > 0);
      
      if (properties.length === 0) {
        setError("Você precisa ter pelo menos um imóvel cadastrado para acessar esta página.");
        setLoading(false);
        return;
      }
      
      // Se tem imóveis, carrega os anúncios
      loadAnnouncements();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        router.push("/login");
        return;
      }
      setError(err?.response?.data?.error || err?.message || "Erro ao verificar imóveis");
      setHasProperties(false);
      setLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      // Usa a rota autenticada que retorna todos os anúncios públicos
      // (a lógica foi ajustada para retornar todos quando não há filtro de propriedade)
      const data = await announcement.list();
      
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
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        router.push("/login");
        return;
      }
      setError(err?.response?.data?.error || err?.message || "Erro ao carregar anúncios");
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
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(date));
  };

  if (loading || hasProperties === null) {
    return (
      <div className="cadastro-page">
        <div className="cadastro-container">
          <div>Carregando...</div>
        </div>
      </div>
    );
  }

  if (hasProperties === false) {
    return (
      <div className="cadastro-page">
        <div className="cadastro-container">
          <div className="cadastro-header">
            <h2>CASAR</h2>
            <h3>Acesso Restrito</h3>
          </div>
          <div className="error-message" style={{ marginBottom: "1rem" }}>
            {error || "Você precisa ter pelo menos um imóvel cadastrado para acessar esta página."}
          </div>
          <div className="form-actions">
            <Link href="/imovel" className="btn btn-primary" style={{ color: "white" }}>
              Cadastrar Primeiro Imóvel
            </Link>
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
    );
  }

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h2>CASAR</h2>
          <h3>Anúncios Disponíveis</h3>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: "#666", margin: 0 }}>
            Encontre o imóvel ideal para você
          </p>
          <Link href="/anuncio" className="btn btn-primary" style={{ color: "white" }}>
            Criar Novo Anúncio
          </Link>
        </div>

        {announcements.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>Nenhum anúncio disponível no momento.</p>
            <Link href="/anuncio" className="btn btn-primary" style={{ marginTop: "1rem", color: "white" }}>
              Criar Primeiro Anúncio
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                      <h4 style={{ margin: 0 }}>{ann.title}</h4>
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
                    {ann.description && (
                      <p style={{ color: "#666", marginBottom: "0.5rem" }}>{ann.description}</p>
                    )}
                    <div style={{ marginBottom: "0.5rem" }}>
                      <p style={{ margin: "0.25rem 0" }}>
                        <strong>Imóvel:</strong> {ann.property.name} ({formatType(ann.property.type)})
                      </p>
                      <p style={{ margin: "0.25rem 0", color: "#666" }}>
                        <strong>Endereço:</strong> {ann.property.address}
                      </p>
                      <p style={{ margin: "0.25rem 0" }}>
                        <strong>Valor:</strong> R$ {ann.average_cost.toLocaleString("pt-BR")} / mês
                      </p>
                      <p style={{ margin: "0.25rem 0" }}>
                        <strong>Vagas disponíveis:</strong> {ann.vacancies}
                      </p>
                      {ann.property.rule.length > 0 && (
                        <div style={{ marginTop: "0.5rem" }}>
                          <strong>Regras:</strong>
                          <ul style={{ marginLeft: "1.5rem", marginTop: "0.25rem" }}>
                            {ann.property.rule.map((r, idx) => (
                              <li key={idx}>
                                {r.attribute.name}: {r.attribute.value}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#666" }}>
                        Publicado em: {formatDate(ann.created_at)}
                      </p>
                    </div>
                  </div>
                  <div style={{ marginLeft: "1rem" }}>
                    <Link
                      href={`/anuncio/${ann.id_property}/${ann.number}`}
                      className="btn btn-primary"
                      style={{ padding: "8px 16px", color: "white" }}
                    >
                      Ver Detalhes
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="form-actions" style={{ marginTop: "1rem" }}>
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
  );
}

