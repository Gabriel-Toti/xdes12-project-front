"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CadastroAnuncio() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [fotos, setFotos] = useState<FileList | null>(null);
  const [valor, setValor] = useState<number | "">("");
  // boost removed per request
  const [vagas, setVagas] = useState<number | "">("");
  const [imovelId, setImovelId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const maxDesc = 480;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFotos(e.target.files);
  };

  const validate = () => {
    if (!titulo.trim()) {
      setError("Título é obrigatório");
      return false;
    }
    if (!descricao.trim()) {
      setError("Descrição é obrigatória");
      return false;
    }
    if (descricao.length > maxDesc) {
      setError(`Descrição deve ter no máximo ${maxDesc} caracteres`);
      return false;
    }
    if (valor === "" || Number(valor) < 0) {
      setError("Informe um valor válido");
      return false;
    }
    if (vagas === "" || Number(vagas) < 1) {
      setError("Número de vagas deve ser >= 1");
      return false;
    }
    if (!imovelId.trim()) {
      setError("Id do imóvel (referência) é obrigatório");
      return false;
    }
    // boost removed

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      // Simulação de envio para API
      await new Promise((res) => setTimeout(res, 900));

      const generatedId = `anuncio_${Date.now()}`;
      setSuccess(`Anúncio criado com sucesso (ID: ${generatedId})`);

      // redireciona para a página do anúncio ou conta
      setTimeout(() => router.push(`/conta`), 1200);
    } catch (err: any) {
      setError(err?.message || "Erro ao criar anúncio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-page">
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h2>CASAR</h2>
          <h3>Cadastro de Anúncio</h3>
        </div>

        <form onSubmit={handleSubmit} className="cadastro-form">
          <div className="form-group">
            <label className="form-label">Título</label>
            <input
              type="text"
              className="form-input"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nome breve do anúncio"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Descrição (até {maxDesc} caracteres)
            </label>
            <textarea
              className="form-textarea"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value.slice(0, maxDesc))}
              placeholder="Detalhes do anúncio"
              maxLength={maxDesc}
              rows={6}
              required
            />
            <div style={{ textAlign: "right", fontSize: 12, color: "#666" }}>
              {descricao.length}/{maxDesc}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Fotos (quartos disponíveis)</label>
            <input
              type="file"
              className="form-input"
              accept="image/*"
              multiple
              onChange={handleFiles}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Valor (R$ / mês)</label>
              <input
                type="number"
                min={0}
                className="form-input"
                value={valor}
                onChange={(e) =>
                  setValor(e.target.value === "" ? "" : Number(e.target.value))
                }
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Número de vagas</label>
              <input
                type="number"
                min={1}
                className="form-input"
                value={vagas}
                onChange={(e) =>
                  setVagas(e.target.value === "" ? "" : Number(e.target.value))
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Id do Imóvel (referência)</label>
              <input
                type="text"
                className="form-input"
                value={imovelId}
                onChange={(e) => setImovelId(e.target.value)}
                placeholder="Id do imóvel ao qual este anúncio se refere"
                required
              />
            </div>
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
              onClick={() => router.push("/")}
            >
              Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
