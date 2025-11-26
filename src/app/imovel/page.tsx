"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { property, rule, preference } from "@/utils/api";
import { getErrorMessage } from "@/utils/error-handler";

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

  // Parse schedule value from backend format "HHh-HHh; HHh-HHh" to entries array
  const parseScheduleValue = (value: string): Array<{ start: string; end: string }> => {
    if (!value) return [];
    const intervals = value.split(";").map(s => s.trim());
    return intervals.map(interval => {
      const [start, end] = interval.split("-").map(s => s.trim());
      // Convert "22h" or "22h30" to "22:00" or "22:30"
      const parseTime = (timeStr: string): string => {
        const match = timeStr.match(/(\d{1,2})h(\d{2})?/);
        if (!match) return "";
        const hour = match[1].padStart(2, "0");
        const minute = match[2] || "00";
        return `${hour}:${minute}`;
      };
      return { start: parseTime(start), end: parseTime(end) };
    }).filter(e => e.start && e.end);
  };

  // Format schedule entries to backend format
  const formatScheduleTime = (time: string): string => {
    if (!time) return "";
    const [hh = "00", mm = "00"] = time.split(":");
    const normalizedHour = hh.padStart(2, "0");
    return !mm || mm === "00" ? `${normalizedHour}h` : `${normalizedHour}h${mm}`;
  };

  const addScheduleEntry = (ruleName: string, start: string, end: string) => {
    const ruleIndex = regras.findIndex(r => r.name === ruleName);
    if (ruleIndex === -1) return;
    
    const rule = regras[ruleIndex];
    const currentEntries = parseScheduleValue(rule.value);
    const newEntries = [...currentEntries, { start, end }];
    const formattedValue = newEntries
      .map((entry: { start: string; end: string }) => 
        `${formatScheduleTime(entry.start)}-${formatScheduleTime(entry.end)}`
      )
      .join("; ");
    
    updateRule(ruleIndex, "value", formattedValue);
  };

  const removeScheduleEntry = (ruleName: string, index: number) => {
    const ruleIndex = regras.findIndex(r => r.name === ruleName);
    if (ruleIndex === -1) return;
    
    const rule = regras[ruleIndex];
    const currentEntries = parseScheduleValue(rule.value);
    currentEntries.splice(index, 1);
    const formattedValue = currentEntries.length > 0
      ? currentEntries
          .map((entry: { start: string; end: string }) => 
            `${formatScheduleTime(entry.start)}-${formatScheduleTime(entry.end)}`
          )
          .join("; ")
      : "";
    
    updateRule(ruleIndex, "value", formattedValue);
  };

  useEffect(() => {
    const loadModel = async () => {
      setLoadingModel(true);
      try {
        const config = await preference.getModel();
        setModel(config);
      } catch (err: any) {
        setError(getErrorMessage(err, "Erro ao carregar modelo"));
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
      // Validar que campos múltiplos têm pelo menos um valor selecionado
      const isMultiple = r.name === "Estilo de Convivência";
      if (isMultiple && (!r.value || r.value.trim() === "")) {
        setError(`A regra "${r.name}" deve ter pelo menos um valor selecionado`);
        return false;
      }
      // Validar schedule
      if (model && model[r.name]?.type === "schedule") {
        const schedule = parseScheduleValue(r.value);
        if (schedule.length === 0) {
          setError(`A regra "${r.name}" deve ter pelo menos um intervalo de horário cadastrado`);
          return false;
        }
      }
      // Validar location
      if (model && model[r.name]?.type === "location") {
        if (!r.value || isNaN(Number(r.value)) || Number(r.value) <= 0) {
          setError(`A regra "${r.name}" deve ser um número válido maior que zero`);
          return false;
        }
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
      const message = getErrorMessage(err, "Erro ao cadastrar imóvel");
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
                  {model && Object.entries(model)
                    .filter(([name]) => name !== "Tipo de Moradia" && name !== "Hobbies")
                    .map(([name]) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                </select>
                {r.name && model && (() => {
                  const fieldConfig = model[r.name];
                  const isMultiple = r.name === "Estilo de Convivência";
                  const currentValues = r.value ? r.value.split(", ") : [];
                  
                  // Campo schedule (Horários de silêncio)
                  if (fieldConfig?.type === "schedule") {
                    const scheduleEntries = parseScheduleValue(r.value || "");
                    return (
                      <div style={{ flex: 1 }}>
                        {scheduleEntries.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                            {scheduleEntries.map((entry: { start: string; end: string }, idx: number) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  alignItems: "center",
                                  padding: "8px",
                                  background: "#f9fafb",
                                  borderRadius: "4px"
                                }}
                              >
                                <span style={{ flex: 1 }}>
                                  {formatScheduleTime(entry.start)} - {formatScheduleTime(entry.end)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeScheduleEntry(r.name, idx)}
                                  style={{
                                    padding: "4px 8px",
                                    background: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer"
                                  }}
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <label className="form-label">Horário de Início</label>
                            <input
                              type="time"
                              className="form-input"
                              id={`schedule-${index}-start`}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label className="form-label">Horário de Fim</label>
                            <input
                              type="time"
                              className="form-input"
                              id={`schedule-${index}-end`}
                            />
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-end" }}>
                            <button
                              type="button"
                              onClick={() => {
                                const startInput = document.getElementById(`schedule-${index}-start`) as HTMLInputElement;
                                const endInput = document.getElementById(`schedule-${index}-end`) as HTMLInputElement;
                                if (startInput?.value && endInput?.value) {
                                  addScheduleEntry(r.name, startInput.value, endInput.value);
                                  startInput.value = "";
                                  endInput.value = "";
                                }
                              }}
                              style={{
                                padding: "8px 16px",
                                background: "#059669",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer"
                              }}
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Campo location (Localização)
                  if (fieldConfig?.type === "location") {
                    return (
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        className="form-input"
                        style={{ flex: 1 }}
                        value={r.value}
                        onChange={(e) => updateRule(index, "value", e.target.value === "" ? "" : e.target.value)}
                        placeholder="Raio máximo em km (ex: 5)"
                        required
                      />
                    );
                  }
                  
                  // Campo múltiplo (Estilo de Convivência)
                  if (isMultiple && fieldConfig?.expected) {
                    return (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", 
                          gap: "8px",
                          padding: "8px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "4px",
                          maxHeight: "150px",
                          overflowY: "auto"
                        }}>
                          {fieldConfig.expected.map((opt) => {
                            const isChecked = currentValues.includes(opt);
                            return (
                              <label key={opt} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    let newValues: string[];
                                    if (e.target.checked) {
                                      newValues = [...currentValues, opt];
                                    } else {
                                      newValues = currentValues.filter(v => v !== opt);
                                    }
                                    updateRule(index, "value", newValues.join(", "));
                                  }}
                                />
                                <span style={{ fontSize: "0.9rem" }}>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                        {currentValues.length > 0 && (
                          <div style={{ fontSize: "0.875rem", color: "#666" }}>
                            Selecionados: {currentValues.join(", ")}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // Verificar tipo do campo
                  if (fieldConfig?.type === "location") {
                    return (
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        className="form-input"
                        style={{ flex: 1 }}
                        value={r.value}
                        onChange={(e) => updateRule(index, "value", e.target.value === "" ? "" : e.target.value)}
                        placeholder="Raio máximo em km (ex: 5)"
                        required
                      />
                    );
                  }
                  
                  if (fieldConfig?.type === "schedule") {
                    const scheduleEntries = parseScheduleValue(r.value);
                    return (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                        {scheduleEntries.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                            {scheduleEntries.map((entry: { start: string; end: string }, idx: number) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  alignItems: "center",
                                  padding: "8px",
                                  background: "#f9fafb",
                                  borderRadius: "4px"
                                }}
                              >
                                <span style={{ flex: 1 }}>
                                  {formatScheduleTime(entry.start)} - {formatScheduleTime(entry.end)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeScheduleEntry(r.name, idx)}
                                  style={{
                                    padding: "4px 8px",
                                    background: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer"
                                  }}
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <label className="form-label">Horário de Início</label>
                            <input
                              type="time"
                              className="form-input"
                              id={`${r.name}-start`}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label className="form-label">Horário de Fim</label>
                            <input
                              type="time"
                              className="form-input"
                              id={`${r.name}-end`}
                            />
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-end" }}>
                            <button
                              type="button"
                              onClick={() => {
                                const startInput = document.getElementById(`${r.name}-start`) as HTMLInputElement;
                                const endInput = document.getElementById(`${r.name}-end`) as HTMLInputElement;
                                if (startInput?.value && endInput?.value) {
                                  addScheduleEntry(r.name, startInput.value, endInput.value);
                                  startInput.value = "";
                                  endInput.value = "";
                                }
                              }}
                              style={{
                                padding: "8px 16px",
                                background: "#059669",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer"
                              }}
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Campo único - usar select
                  return (
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
                      {fieldConfig?.expected.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  );
                })()}
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
