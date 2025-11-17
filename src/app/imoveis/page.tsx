"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { property } from "@/utils/api";

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
  rules: Array<{ name: string; value: string }>;
  active_announcements: number;
};

export default function Imoveis() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await property.list();
      setProperties(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        router.push("/login");
        return;
      }
      setError(err?.response?.data?.error || err?.message || "Erro ao carregar imóveis");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita.")) {
      return;
    }

    setDeletingId(id);
    try {
      await property.delete(id);
      await loadProperties();
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || "Erro ao excluir imóvel";
      alert(message);
    } finally {
      setDeletingId(null);
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
            <Link href="/imovel" className="btn btn-primary" style={{ marginTop: "1rem" }}>
              Cadastrar Primeiro Imóvel
            </Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "1rem", textAlign: "right" }}>
              <Link href="/imovel" className="btn btn-primary" style={{ color: "white" }}>
                Cadastrar Novo Imóvel
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {properties.map((prop) => (
                <div key={prop.id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ marginBottom: "0.5rem" }}>{prop.name}</h4>
                      <p style={{ color: "#666", marginBottom: "0.5rem" }}>
                        {formatType(prop.type)} • {prop.address}
                      </p>
                      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                        <span>Vagas: {prop.total_vacancies}</span>
                        <span>Quartos: {prop.total_dorms}</span>
                        <span>Banheiros: {prop.total_bathrooms}</span>
                        {prop.garage && <span>Garagem</span>}
                        {prop.external_area && <span>Área Externa</span>}
                      </div>
                      <p style={{ color: "#666", marginBottom: "0.5rem" }}>
                        <strong>Custos:</strong> {prop.costs}
                      </p>
                      {prop.rules.length > 0 && (
                        <div style={{ marginBottom: "0.5rem" }}>
                          <strong>Regras:</strong>
                          <ul style={{ marginLeft: "1.5rem", marginTop: "0.25rem" }}>
                            {prop.rules.map((r, idx) => (
                              <li key={idx}>
                                {r.name}: {r.value}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {prop.active_announcements > 0 && (
                        <p style={{ color: "#d97706", marginBottom: "0.5rem" }}>
                          ⚠ {prop.active_announcements} anúncio(s) ativo(s)
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
                        disabled={deletingId === prop.id || prop.active_announcements > 0}
                        style={{ padding: "8px 16px" }}
                        title={prop.active_announcements > 0 ? "Não é possível excluir imóvel com anúncios ativos" : ""}
                      >
                        {deletingId === prop.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {properties.length >= 5 && (
              <div style={{ marginTop: "1rem", padding: "1rem", background: "#fef3c7", borderRadius: "8px", color: "#92400e" }}>
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
  );
}

