"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { announcement, property } from "@/utils/api";
import Navbar from "@/components/Navbar";

export default function CadastroAnuncio() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState<number | "">("");
  const [boost, setBoost] = useState(false);
  const [vagas, setVagas] = useState<number | "">("");
  const [imovelId, setImovelId] = useState("");
  const [properties, setProperties] = useState<Array<{ id: string; name: string; total_vacancies: number }>>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const maxDesc = 128;

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setLoadingProperties(true);
    try {
      const data = await property.list();
      // Verificar se o usuário é admin de pelo menos uma propriedade
      // A API já retorna apenas propriedades onde o usuário é admin
      if (data && data.length > 0) {
        setProperties(data);
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        setError("Apenas responsáveis por imóveis podem cadastrar anúncios. Você precisa ser administrador de pelo menos um imóvel.");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        router.push("/login");
        return;
      }
      setIsAuthorized(false);
      setError(err?.response?.data?.error || err?.message || "Erro ao carregar imóveis");
    } finally {
      setLoadingProperties(false);
    }
  };

  const validate = () => {
    if (!titulo.trim()) {
      setError("Título é obrigatório");
      return false;
    }
    if (titulo.length > 32) {
      setError("Título deve ter no máximo 32 caracteres");
      return false;
    }
    if (descricao && descricao.length > maxDesc) {
      setError(`Descrição deve ter no máximo ${maxDesc} caracteres`);
      return false;
    }
    if (valor === "" || Number(valor) <= 0) {
      setError("Informe um valor válido maior que zero");
      return false;
    }
    if (vagas === "" || Number(vagas) < 1) {
      setError("Número de vagas deve ser >= 1");
      return false;
    }
    if (!imovelId.trim()) {
      setError("Selecione um imóvel");
      return false;
    }

    const selectedProperty = properties.find(p => p.id === imovelId);
    if (selectedProperty && Number(vagas) > selectedProperty.total_vacancies) {
      setError(`Número de vagas não pode ser maior que o total de vagas do imóvel (${selectedProperty.total_vacancies})`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      // Se boost foi ativado, criar anúncio sem boost primeiro
      // Depois redirecionar para pagamento
      const boostValue = boost;
      const createData = {
        title: titulo,
        description: descricao || undefined,
        average_cost: Number(valor),
        boost: false, // Criar sem boost primeiro
        vacancies: Number(vagas),
        id_property: imovelId
      };

      const result = await announcement.create(createData);

      // Se boost foi solicitado, redirecionar para pagamento
      if (boostValue && result && result.number) {
        router.push(`/pagamento?type=boost&propertyId=${imovelId}&number=${result.number}`);
        return;
      }

      setSuccess("Anúncio criado com sucesso!");
      setTimeout(() => router.push("/imoveis"), 1200);
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || "Erro ao criar anúncio";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const selectedProperty = properties.find(p => p.id === imovelId);
  const maxVacancies = selectedProperty?.total_vacancies || 0;

  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <div className="cadastro-page">
          <div className="cadastro-container">
            <div className="cadastro-header">
              <h2>CASAR</h2>
              <h3>Cadastro de Anúncio</h3>
            </div>

            {loadingProperties ? (
              <div>Carregando imóveis...</div>
            ) : isAuthorized === false ? (
              <div>
                <div className="error-message">
                  {error || "Apenas responsáveis por imóveis podem cadastrar anúncios. Você precisa ser administrador de pelo menos um imóvel."}
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => router.push("/imoveis")}
                  style={{ marginTop: "1rem" }}
                >
                  Voltar para Meus Imóveis
                </button>
              </div>
            ) : properties.length === 0 ? (
              <div>
                <div className="error-message">Você não possui imóveis cadastrados. Cadastre um imóvel primeiro.</div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => router.push("/imovel")}
                  style={{ marginTop: "1rem" }}
                >
                  Cadastrar Imóvel
                </button>
              </div>
            ) : (
          <form onSubmit={handleSubmit} className="cadastro-form">
            <div className="form-group">
              <label className="form-label">Imóvel</label>
              <select
                className="form-select"
                value={imovelId}
                onChange={(e) => {
                  setImovelId(e.target.value);
                  setVagas("");
                }}
                required
              >
                <option value="" disabled>
                  Selecione um imóvel
                </option>
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name} (Máx: {prop.total_vacancies} vagas)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Título (máx. 32 caracteres)</label>
              <input
                type="text"
                className="form-input"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value.slice(0, 32))}
                placeholder="Nome breve do anúncio"
                maxLength={32}
                required
              />
              <div style={{ textAlign: "right", fontSize: 12, color: "#666", marginTop: "4px" }}>
                {titulo.length}/32
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Descrição (opcional, até {maxDesc} caracteres)
              </label>
              <textarea
                className="form-textarea"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value.slice(0, maxDesc))}
                placeholder="Detalhes do anúncio"
                maxLength={maxDesc}
                rows={4}
              />
              <div style={{ textAlign: "right", fontSize: 12, color: "#666", marginTop: "4px" }}>
                {descricao.length}/{maxDesc}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Valor (R$ / mês)</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="form-input"
                  value={valor}
                  onChange={(e) =>
                    setValor(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Número de vagas</label>
                <input
                  type="number"
                  min={1}
                  max={maxVacancies}
                  className="form-input"
                  value={vagas}
                  onChange={(e) =>
                    setVagas(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  required
                  disabled={!imovelId}
                />
                {selectedProperty && (
                  <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "4px" }}>
                    Máximo: {maxVacancies} vagas
                  </p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <input
                  type="checkbox"
                  checked={boost}
                  onChange={(e) => setBoost(e.target.checked)}
                  style={{ marginRight: "8px" }}
                />
                Boost (destaque no anúncio - pago)
              </label>
              <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "4px" }}>
                Anúncios com boost aparecem primeiro na listagem
              </p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Salvando..." : "Publicar Anúncio"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.push("/imoveis")}
              >
                Voltar
              </button>
            </div>
          </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
