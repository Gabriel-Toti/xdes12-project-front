"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { property, rule, preference } from "@/utils/api";

type ModelField = {
  type: string;
  expected: string[];
};

export default function EditarImovel() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [custos, setCustos] = useState("");
  const [numeroVagas, setNumeroVagas] = useState<number | "">("");
  const [propertyData, setPropertyData] = useState<any>(null);
  const [rules, setRules] = useState<Array<{ name: string; value: string }>>([]);
  const [model, setModel] = useState<Record<string, ModelField> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingModel, setLoadingModel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadModel();
      loadProperty();
    }
  }, [id]);

  const loadModel = async () => {
    setLoadingModel(true);
    try {
      const config = await preference.getModel();
      setModel(config);
    } catch (err: any) {
      console.error("Erro ao carregar modelo:", err);
    } finally {
      setLoadingModel(false);
    }
  };

  const loadProperty = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await property.get(id);
      const cleanProperty = data.cleanProperty;
      
      setPropertyData(cleanProperty);
      setCustos(cleanProperty.costs || "");
      setNumeroVagas(cleanProperty.total_vacancies || "");
      setRules(cleanProperty.rule || []);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        router.push("/login");
        return;
      }
      setError(err?.response?.data?.error || err?.message || "Erro ao carregar imóvel");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProperty = async () => {
    if (!custos.trim()) {
      setError("Custos são obrigatórios");
      return;
    }
    if (numeroVagas === "" || Number(numeroVagas) <= 0) {
      setError("Número de vagas deve ser maior que zero");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await property.update(id, {
        costs: custos,
        total_vacancies: Number(numeroVagas)
      });
      setSuccess("Imóvel atualizado com sucesso!");
      setTimeout(() => router.push("/imoveis"), 900);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Erro ao atualizar imóvel");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRule = async (name: string, value: string) => {
    try {
      await rule.update(id, name, { value });
      setRules(rules.map(r => r.name === name ? { ...r, value } : r));
      setSuccess("Regra atualizada com sucesso!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Erro ao atualizar regra");
    }
  };

  const handleDeleteRule = async (name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a regra "${name}"?`)) {
      return;
    }

    try {
      await rule.delete(id, name);
      setRules(rules.filter(r => r.name !== name));
      setSuccess("Regra excluída com sucesso!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Erro ao excluir regra");
    }
  };

  const handleAddRule = async () => {
    if (!model) {
      setError("Modelo de atributos não carregado");
      return;
    }

    const availableAttributes = Object.keys(model).filter(
      attrName => !rules.some(r => r.name === attrName)
    );

    if (availableAttributes.length === 0) {
      setError("Todas as regras possíveis já foram cadastradas");
      return;
    }

    const firstAvailable = availableAttributes[0];
    const fieldConfig = model[firstAvailable];
    const defaultValue = fieldConfig.expected?.[0] || "";

    try {
      await rule.create(id, {
        rules: [{ name: firstAvailable, value: defaultValue }]
      });
      setRules([...rules, { name: firstAvailable, value: defaultValue }]);
      setSuccess("Regra adicionada com sucesso!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Erro ao adicionar regra");
    }
  };

  if (loading) {
    return (
      <div className="cadastro-page">
        <div className="cadastro-container">
          <div>Carregando imóvel...</div>
        </div>
      </div>
    );
  }

  if (!propertyData) {
    return (
      <div className="cadastro-page">
        <div className="cadastro-container">
          <div className="error-message">Imóvel não encontrado</div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.push("/imoveis")}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h2>CASAR</h2>
          <h3>Editar Imóvel: {propertyData.name}</h3>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="cadastro-form">
          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f3f4f6", borderRadius: "8px" }}>
            <h4 style={{ marginBottom: "0.5rem" }}>Informações do Imóvel</h4>
            <p><strong>Nome:</strong> {propertyData.name}</p>
            <p><strong>Tipo:</strong> {propertyData.type}</p>
            <p><strong>Endereço:</strong> {propertyData.address}</p>
            <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              ⚠ Localização e estrutura não podem ser alteradas após o cadastro.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Custos</label>
            <input
              type="text"
              className="form-input"
              value={custos}
              onChange={(e) => setCustos(e.target.value)}
              placeholder="Ex: R$ 2.500,00 (aluguel) + R$ 300,00 (contas)"
              maxLength={256}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Número de Vagas</label>
            <input
              type="number"
              min={1}
              className="form-input"
              value={numeroVagas}
              onChange={(e) =>
                setNumeroVagas(e.target.value === "" ? "" : Number(e.target.value))
              }
              required
            />
            <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.25rem" }}>
              Não é possível reduzir abaixo do número de vagas já anunciadas.
            </p>
          </div>

          <div style={{ marginTop: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 style={{ margin: 0 }}>Regras do Imóvel</h4>
              {model && (
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="btn btn-secondary"
                  style={{ padding: "8px 16px" }}
                  disabled={Object.keys(model).every(attrName => rules.some(r => r.name === attrName))}
                  title={Object.keys(model).every(attrName => rules.some(r => r.name === attrName)) ? "Todas as regras possíveis já foram cadastradas" : ""}
                >
                  Adicionar Regra
                </button>
              )}
            </div>
            {loadingModel ? (
              <p style={{ color: "#666" }}>Carregando opções de regras...</p>
            ) : rules.length === 0 ? (
              <div>
                <p style={{ color: "#666", marginBottom: "1rem" }}>Nenhuma regra cadastrada.</p>
                {model && (
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="btn btn-primary"
                  >
                    Adicionar Primeira Regra
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {rules.map((r, idx) => {
                  const fieldConfig = model?.[r.name];
                  const expectedValues = fieldConfig?.expected || [];
                  
                  return (
                    <div key={idx} className="card" style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <strong>{r.name}</strong>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(r.name)}
                          className="btn btn-secondary"
                          style={{ padding: "4px 12px", fontSize: "0.875rem" }}
                          disabled={rules.length <= 1}
                          title={rules.length <= 1 ? "A propriedade deve ter ao menos 1 regra" : ""}
                        >
                          Excluir
                        </button>
                      </div>
                      {fieldConfig && expectedValues.length > 0 ? (
                        <select
                          className="form-select"
                          value={r.value}
                          onChange={(e) => handleUpdateRule(r.name, e.target.value)}
                        >
                          {expectedValues.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="form-input"
                          value={r.value}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setRules(rules.map(rule => rule.name === r.name ? { ...rule, value: newValue } : rule));
                          }}
                          onBlur={() => handleUpdateRule(r.name, r.value)}
                          placeholder="Valor da regra"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="form-actions" style={{ marginTop: "2rem" }}>
            <button
              type="button"
              onClick={handleUpdateProperty}
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push("/imoveis")}
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

