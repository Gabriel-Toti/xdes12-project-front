"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { property, rule, preference } from "@/utils/api";

export default function CadastroImovel() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numeroVagas, setNumeroVagas] = useState<number | "">("");
  const [quartos, setQuartos] = useState<number | "">("");
  const [banheiros, setBanheiros] = useState<number | "">("");
  const [garagem, setGaragem] = useState(false);
  const [areaExterna, setAreaExterna] = useState(false);
  const [custos, setCustos] = useState("");
  const [regras, setRegras] = useState<Array<{ name: string; value: string }>>([]);
  const [model, setModel] = useState<Record<string, { type: string; expected: string[] }> | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      setLoadingModel(true);
      try {
        const config = await preference.getModel();
        setModel(config);
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.message || "Erro ao carregar modelo");
      } finally {
        setLoadingModel(false);
      }
    };
    loadModel();
  }, []);

  const addRule = () => {
    setRegras([...regras, { name: "", value: "" }]);
  };

  const removeRule = (index: number) => {
    setRegras(regras.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: "name" | "value", val: string) => {
    const updated = [...regras];
    updated[index] = { ...updated[index], [field]: val };
    setRegras(updated);
  };

  const validate = () => {
    if (!nome.trim()) {
      setError("Nome do imóvel é obrigatório");
      return false;
    }
    if (!tipo) {
      setError("Tipo de propriedade é obrigatório");
      return false;
    }
    if (!endereco.trim()) {
      setError("Endereço é obrigatório");
      return false;
    }
    if (numeroVagas === "" || Number(numeroVagas) <= 0) {
      setError("Número de vagas deve ser maior que zero");
      return false;
    }
    if (quartos === "" || Number(quartos) <= 0) {
      setError("Número de quartos deve ser maior que zero");
      return false;
    }
    if (banheiros === "" || Number(banheiros) <= 0) {
      setError("Número de banheiros deve ser maior que zero");
      return false;
    }
    if (!custos.trim()) {
      setError("Custos são obrigatórios");
      return false;
    }
    if (regras.length === 0) {
      setError("É necessário cadastrar ao menos uma regra");
      return false;
    }
    for (const r of regras) {
      if (!r.name || !r.value) {
        setError("Todas as regras devem ter nome e valor preenchidos");
        return false;
      }
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
      // Verificar limite antes de criar
      const existingProperties = await property.list();
      if (existingProperties.length >= 5) {
        setError("Você atingiu o limite de 5 imóveis cadastrados.");
        setLoading(false);
        return;
      }

      const propertyData = {
        name: nome,
        type: tipo,
        address: endereco,
        total_vacancies: Number(numeroVagas),
        total_dorms: Number(quartos),
        total_bathrooms: Number(banheiros),
        garage: garagem,
        external_area: areaExterna,
        costs: custos,
        members: [] as Array<{ id: string }>
      };

      const result = await property.create(propertyData);
      const propertyId = result.id;

      await rule.create(propertyId, { rules: regras });

      setSuccess("Imóvel cadastrado com sucesso!");
      setTimeout(() => router.push("/imoveis"), 1200);
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || "Erro ao cadastrar imóvel";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingModel) {
    return (
      <div className="cadastro-page">
        <div className="cadastro-container">
          <div>Carregando modelo de atributos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h2>CASAR</h2>
          <h3>Cadastro de Imóvel</h3>
        </div>

        <form onSubmit={handleSubmit} className="cadastro-form">
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input
              type="text"
              className="form-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome da república/imóvel"
              maxLength={64}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Propriedade</label>
            <select
              className="form-select"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
            >
              <option value="" disabled>
                Selecione o tipo
              </option>
              <option value="CASA">Casa</option>
              <option value="APARTAMENTO">Apartamento</option>
              <option value="REPUBLICA">República</option>
              <option value="PENSAO">Pensão</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Endereço completo</label>
            <textarea
              className="form-textarea"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro, cidade, estado"
              maxLength={128}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Número de vagas (moradores máximos)</label>
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
            </div>

            <div className="form-group">
              <label className="form-label">Quartos</label>
              <input
                type="number"
                min={1}
                className="form-input"
                value={quartos}
                onChange={(e) =>
                  setQuartos(e.target.value === "" ? "" : Number(e.target.value))
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Banheiros</label>
              <input
                type="number"
                min={1}
                className="form-input"
                value={banheiros}
                onChange={(e) =>
                  setBanheiros(e.target.value === "" ? "" : Number(e.target.value))
                }
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Garagem</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={garagem}
                  onChange={(e) => setGaragem(e.target.checked)}
                />
                <span>Possui garagem</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Área Externa</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={areaExterna}
                  onChange={(e) => setAreaExterna(e.target.checked)}
                />
                <span>Possui área externa</span>
              </div>
            </div>
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
            <label className="form-label">Regras (obrigatório ao menos uma)</label>
            {regras.map((r, index) => (
              <div key={index} style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                <select
                  className="form-select"
                  style={{ flex: 1 }}
                  value={r.name}
                  onChange={(e) => updateRule(index, "name", e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Selecione o atributo
                  </option>
                  {model && Object.entries(model).map(([name]) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                {r.name && model && (
                  <select
                    className="form-select"
                    style={{ flex: 1 }}
                    value={r.value}
                    onChange={(e) => updateRule(index, "value", e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Selecione o valor
                    </option>
                    {model[r.name]?.expected.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => removeRule(index)}
                  className="btn btn-secondary"
                  style={{ padding: "8px 16px" }}
                >
                  Remover
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addRule}
              className="btn btn-secondary"
              style={{ marginTop: 8 }}
            >
              Adicionar Regra
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Cadastrar Imóvel"}
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
      </div>
    </div>
  );
}
