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
  const [images, setImages] = useState<Array<{ id: string; image_url: string }>>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [selectedAttributeToAdd, setSelectedAttributeToAdd] = useState("");

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
    const rule = rules.find(r => r.name === ruleName);
    if (!rule) return;
    
    const currentEntries = parseScheduleValue(rule.value);
    const newEntries = [...currentEntries, { start, end }];
    const formattedValue = newEntries
      .map((entry: { start: string; end: string }) => 
        `${formatScheduleTime(entry.start)}-${formatScheduleTime(entry.end)}`
      )
      .join("; ");
    
    setRules(rules.map(r => r.name === ruleName ? { ...r, value: formattedValue } : r));
    handleUpdateRule(ruleName, formattedValue);
  };

  const removeScheduleEntry = (ruleName: string, index: number) => {
    const rule = rules.find(r => r.name === ruleName);
    if (!rule) return;
    
    const currentEntries = parseScheduleValue(rule.value);
    currentEntries.splice(index, 1);
    const formattedValue = currentEntries.length > 0
      ? currentEntries
          .map((entry: { start: string; end: string }) => 
            `${formatScheduleTime(entry.start)}-${formatScheduleTime(entry.end)}`
          )
          .join("; ")
      : "";
    
    setRules(rules.map(r => r.name === ruleName ? { ...r, value: formattedValue } : r));
    handleUpdateRule(ruleName, formattedValue);
  };

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
      // Carregar imagens do imóvel com IDs
      const loadedImages = cleanProperty.images?.map((img: any) => ({
        id: img.id,
        image_url: img.image_url
      })) || [];
      setImages(loadedImages);
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

  const addScheduleEntry = (ruleName: string, start: string, end: string) => {
    const rule = rules.find(r => r.name === ruleName);
    if (!rule) return;
    
    const schedule = parseScheduleValue(rule.value || "");
    const newEntries = [...schedule, { start, end }];
    const formattedValue = newEntries
      .map((entry: { start: string; end: string }) => 
        `${formatScheduleTime(entry.start)}-${formatScheduleTime(entry.end)}`
      )
      .join("; ");
    
    handleUpdateRule(ruleName, formattedValue);
  };

  const removeScheduleEntry = (ruleName: string, entryIndex: number) => {
    const rule = rules.find(r => r.name === ruleName);
    if (!rule) return;
    
    const schedule = parseScheduleValue(rule.value || "");
    schedule.splice(entryIndex, 1);
    const formattedValue = schedule.length > 0
      ? schedule
          .map((entry: { start: string; end: string }) => 
            `${formatScheduleTime(entry.start)}-${formatScheduleTime(entry.end)}`
          )
          .join("; ")
      : "";
    
    handleUpdateRule(ruleName, formattedValue);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validar todos os arquivos
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        setError("Por favor, selecione apenas arquivos de imagem");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Cada imagem deve ter no máximo 5MB");
        return;
      }
    }

    setUploadingImage(true);
    setError(null);
    try {
      const result = await property.uploadImage(id, fileArray);
      // Recarregar propriedade para obter os IDs das novas imagens
      const data = await property.get(id);
      const loadedImages = data.cleanProperty.images?.map((img: any) => ({
        id: img.id,
        image_url: img.image_url
      })) || [];
      setImages(loadedImages);
      setSuccess(`${result.count} imagem(ns) enviada(s) com sucesso!`);
      setTimeout(() => setSuccess(null), 3000);
      // Limpar o input
      e.target.value = '';
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Erro ao enviar imagens");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta imagem?")) {
      return;
    }

    setDeletingImageId(imageId);
    setError(null);
    try {
      await property.deleteImage(id, imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
      setSuccess("Imagem deletada com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Erro ao deletar imagem");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleAddRule = async () => {
    if (!model) {
      setError("Modelo de atributos não carregado");
      return;
    }

    if (!selectedAttributeToAdd) {
      setError("Selecione um atributo para adicionar");
      return;
    }

    const fieldConfig = model[selectedAttributeToAdd];
    const defaultValue = fieldConfig.expected?.[0] || "";

    try {
      await rule.create(id, {
        rules: [{ name: selectedAttributeToAdd, value: defaultValue }]
      });
      setRules([...rules, { name: selectedAttributeToAdd, value: defaultValue }]);
      setShowAddRuleModal(false);
      setSelectedAttributeToAdd("");
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
                  onClick={() => setShowAddRuleModal(true)}
                  className="btn btn-secondary"
                  style={{ padding: "8px 16px" }}
                  disabled={Object.keys(model).every(attrName => rules.some(r => r.name === attrName))}
                  title={Object.keys(model).every(attrName => rules.some(r => r.name === attrName)) ? "Todas as regras possíveis já foram cadastradas" : ""}
                >
                  Adicionar Regra
                </button>
              )}
            </div>
            
            {/* Modal para escolher qual regra adicionar */}
            {showAddRuleModal && model && (
              <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000
              }}>
                <div style={{
                  background: "white",
                  padding: "2rem",
                  borderRadius: "8px",
                  maxWidth: "500px",
                  width: "90%",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
                }}>
                  <h3 style={{ marginBottom: "1rem" }}>Adicionar Nova Regra</h3>
                  <div className="form-group">
                    <label className="form-label">Selecione o atributo:</label>
                    <select
                      className="form-select"
                      value={selectedAttributeToAdd}
                      onChange={(e) => setSelectedAttributeToAdd(e.target.value)}
                    >
                      <option value="" disabled>
                        Selecione um atributo
                      </option>
                      {Object.keys(model)
                        .filter(attrName => 
                          attrName !== "Tipo de Moradia" && 
                          attrName !== "Hobbies" &&
                          !rules.some(r => r.name === attrName)
                        )
                        .map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddRuleModal(false);
                        setSelectedAttributeToAdd("");
                      }}
                      className="btn btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddRule}
                      className="btn btn-primary"
                      disabled={!selectedAttributeToAdd}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )}
            {loadingModel ? (
              <p style={{ color: "#666" }}>Carregando opções de regras...</p>
            ) : rules.length === 0 ? (
              <div>
                <p style={{ color: "#666", marginBottom: "1rem" }}>Nenhuma regra cadastrada.</p>
                {model && (
                  <button
                    type="button"
                    onClick={() => setShowAddRuleModal(true)}
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
                  const isMultiple = r.name === "Estilo de Convivência";
                  const currentValues = r.value ? r.value.split(", ") : [];
                  
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
                      {fieldConfig ? (
                        // Campo schedule (Horários de silêncio)
                        fieldConfig.type === "schedule" ? (
                          <div>
                            {(() => {
                              const scheduleEntries = parseScheduleValue(r.value || "");
                              return (
                                <>
                                  {scheduleEntries.length > 0 && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                                      {scheduleEntries.map((entry: { start: string; end: string }, entryIdx: number) => (
                                        <div
                                          key={entryIdx}
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
                                            onClick={() => removeScheduleEntry(r.name, entryIdx)}
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
                                        id={`schedule-${idx}-start`}
                                      />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <label className="form-label">Horário de Fim</label>
                                      <input
                                        type="time"
                                        className="form-input"
                                        id={`schedule-${idx}-end`}
                                      />
                                    </div>
                                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const startInput = document.getElementById(`schedule-${idx}-start`) as HTMLInputElement;
                                          const endInput = document.getElementById(`schedule-${idx}-end`) as HTMLInputElement;
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
                                </>
                              );
                            })()}
                          </div>
                        ) : 
                        // Campo location (Localização)
                        fieldConfig.type === "location" ? (
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            className="form-input"
                            value={r.value}
                            onChange={(e) => {
                              const newValue = e.target.value === "" ? "" : e.target.value;
                              setRules(rules.map(rule => rule.name === r.name ? { ...rule, value: newValue } : rule));
                            }}
                            onBlur={() => handleUpdateRule(r.name, r.value)}
                            placeholder="Raio máximo em km (ex: 5)"
                          />
                        ) :
                        // Campo múltiplo (Estilo de Convivência)
                        isMultiple && expectedValues.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
                              {expectedValues.map((opt) => {
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
                                        const newValue = newValues.join(", ");
                                        setRules(rules.map(rule => rule.name === r.name ? { ...rule, value: newValue } : rule));
                                        handleUpdateRule(r.name, newValue);
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
                        ) :
                        // Campo único - usar select
                        expectedValues.length > 0 ? (
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
                        )
                      ) : fieldConfig?.type === "location" ? (
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          className="form-input"
                          value={r.value}
                          onChange={(e) => {
                            const newValue = e.target.value === "" ? "" : e.target.value;
                            setRules(rules.map(rule => rule.name === r.name ? { ...rule, value: newValue } : rule));
                          }}
                          onBlur={() => handleUpdateRule(r.name, r.value)}
                          placeholder="Raio máximo em km (ex: 5)"
                        />
                      ) : fieldConfig?.type === "schedule" ? (
                        <div>
                          <div style={{ marginBottom: 12 }}>
                            {(() => {
                              const scheduleEntries = parseScheduleValue(r.value);
                              return scheduleEntries.length > 0 && (
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
                              );
                            })()}
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
                        </div>
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

          <div className="form-group" style={{ marginTop: "2rem" }}>
            <label className="form-label">Imagens do Imóvel</label>
            {images.length > 0 && (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
                gap: "1rem", 
                marginBottom: "1rem" 
              }}>
                {images.map((img) => (
                  <div key={img.id} style={{ position: "relative" }}>
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${img.image_url}`}
                      alt={`Imagem do imóvel`}
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      disabled={deletingImageId === img.id}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "rgba(220, 38, 38, 0.9)",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        cursor: deletingImageId === img.id ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        fontWeight: "bold"
                      }}
                      title="Deletar imagem"
                    >
                      {deletingImageId === img.id ? "..." : "×"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploadingImage}
              style={{ marginBottom: "0.5rem" }}
            />
            {uploadingImage && <div style={{ color: "#666" }}>Enviando imagens...</div>}
            <p style={{ fontSize: "0.875rem", color: "#666" }}>
              Você pode selecionar múltiplas imagens (máximo 10, 5MB cada). Formatos aceitos: JPG, PNG, GIF.
            </p>
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

