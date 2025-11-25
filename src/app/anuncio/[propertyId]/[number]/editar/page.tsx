"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { announcement, property } from "@/utils/api";

export default function EditarAnuncio() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const number = parseInt(params.number as string);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState<number | "">("");
  const [boost, setBoost] = useState(false);
  const [vagas, setVagas] = useState<number | "">("");
  const [propertyData, setPropertyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<Array<{ id: string; image_url: string }>>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [originalBoost, setOriginalBoost] = useState(false);

  const maxDesc = 128;

  useEffect(() => {
    if (propertyId && number) {
      loadAnnouncement();
      loadProperty();
    }
  }, [propertyId, number]);

  const loadAnnouncement = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await announcement.get(propertyId, number);
      setTitulo(data.title || "");
      setDescricao(data.description || "");
      setValor(data.average_cost || "");
      const boostValue = data.boost === true;
      setBoost(boostValue);
      setOriginalBoost(boostValue);
      setVagas(data.vacancies || "");
      // Carregar imagens do anúncio com IDs
      const loadedImages = data.images?.map((img: any) => ({
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
      setError(err?.response?.data?.error || err?.message || "Erro ao carregar anúncio");
    } finally {
      setLoading(false);
    }
  };

  const loadProperty = async () => {
    try {
      const data = await property.get(propertyId);
      setPropertyData(data.cleanProperty);
    } catch (err: any) {
      console.error("Erro ao carregar propriedade:", err);
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
    if (propertyData && Number(vagas) > propertyData.total_vacancies) {
      setError(`Número de vagas não pode ser maior que o total de vagas do imóvel (${propertyData.total_vacancies})`);
      return false;
    }
    setError(null);
    return true;
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
      const result = await announcement.uploadImage(propertyId, number, fileArray);
      // Recarregar anúncio para obter os IDs das novas imagens
      const data = await announcement.get(propertyId, number);
      const loadedImages = data.images?.map((img: any) => ({
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
      await announcement.deleteImage(propertyId, number, imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
      setSuccess("Imagem deletada com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Erro ao deletar imagem");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Se boost foi ativado (mudou de false para true), redirecionar para página de pagamento
    if (boost && !originalBoost) {
      router.push(`/pagamento?type=boost&propertyId=${propertyId}&number=${number}`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await announcement.update(propertyId, number, {
        title: titulo,
        description: descricao || undefined,
        average_cost: Number(valor),
        boost: boost,
        vacancies: Number(vagas)
      });

      setSuccess("Anúncio atualizado com sucesso!");
      setTimeout(() => router.push(`/anuncio/${propertyId}/${number}`), 900);
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || "Erro ao atualizar anúncio";
      setError(message);
    } finally {
      setSaving(false);
    }
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

  const maxVacancies = propertyData?.total_vacancies || 0;

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h2>CASAR</h2>
          <h3>Editar Anúncio</h3>
        </div>

        {propertyData && (
          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f3f4f6", borderRadius: "8px" }}>
            <h4 style={{ marginBottom: "0.5rem" }}>Imóvel: {propertyData.name}</h4>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>
              Total de vagas do imóvel: {maxVacancies}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="cadastro-form">
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
              />
              {propertyData && (
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

          <div className="form-group" style={{ marginTop: "2rem" }}>
            <label className="form-label">Imagens do Anúncio</label>
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
                      alt={`Imagem do anúncio`}
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

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push(`/anuncio/${propertyId}/${number}`)}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

