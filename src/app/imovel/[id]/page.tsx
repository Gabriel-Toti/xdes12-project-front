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

  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [selectedAttributeToAdd, setSelectedAttributeToAdd] = useState("");

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
                        .filter(attrName => !rules.some(r => r.name === attrName))
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
                  const isMultiple = r.name === "Hobbies" || r.name === "Estilo de Convivência";
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
                      {fieldConfig && expectedValues.length > 0 ? (
                        isMultiple ? (
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
                        ) : (
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
                        )
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

